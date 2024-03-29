import puppeteer from 'puppeteer-core'
import { WclItems, WclTables, get_rankings, get_reports, get_reports_fight, get_reports_fight_source, get_id_from_uri } from './extract'
import mongodb from 'mongodb'
import axios from 'axios'
import cheerio from 'cheerio'
import url from 'url'

export async function get_page(browser: puppeteer.Browser, uri: string, s: string[], sel: string, ua: string = '') {
    if (uri == "" || uri == "#") {
        return ""
    }

    let pages = await browser.pages()
    let page
    if (pages.length == 0) {
        page = await browser.newPage()
    } else {
        page = pages[0]
    }

    page.setDefaultTimeout(100000)
    if (ua) await page.setUserAgent(ua)
    await page.setExtraHTTPHeaders({
        dnt: '1',
    })
    await page.setCacheEnabled(true)
    await page.setRequestInterception(true)
    page.on('request', interceptedRequest => {
        let method = interceptedRequest.method()
        let uri = interceptedRequest.url()
        let host = url.parse(uri, true).host || ""

        let resourceType = interceptedRequest.resourceType()
        // console.log(host)
        if (method != "GET" ||
            ['image', 'stylesheet', 'font', "other"].includes(resourceType) ||
            !['cdnjs.cloudflare.com', 'dmszsuqyoe6y6.cloudfront.net', 'cdn.jsdelivr.net', 'cdn.datatables.net',
                'cn.warcraftlogs.com', 'www.warcraftlogs.com'].includes(host)) {
            // console.log("abort", interceptedRequest.method(), interceptedRequest.resourceType(), uri)
            interceptedRequest.abort()
        } else {
            console.log(interceptedRequest.method(), uri)
            // console.log("continue", interceptedRequest.method(), interceptedRequest.resourceType(), uri)
            interceptedRequest.continue()
        }
    })

    await page.goto(uri, {
        waitUntil: "networkidle2",
    })

    for (let i in s) {
        await page.waitFor(10)
        await page.evaluate(s[i])
    }
    await page.waitFor(100)

    let content = await page.$eval(sel, el => el.innerHTML)

    await page.close()
    return content
}

export async function save_reports(db: mongodb.Db, browser: puppeteer.Browser, uri: string, ua: string): Promise<WclItems> {
    let coll = db.collection("reports")
    let result = await coll.findOne({
        _id: uri,
    })
    if (result) {
        return result
    }

    let s = `
    $("a.report-overview-boss-caption[onmousedown]").each(function (_, x) {
        try {
            x.onmousedown()
        } catch (error) {

        }
    })
`
    console.log("reports", uri)
    let data = await get_page(browser, uri, [s], 'body', ua)
    if (!data) {
        return result
    }
    result = get_reports(data)
    await coll.updateOne(
        {
            _id: uri
        }, {
        $set: { update: new Date(), ...result }
    }, {
        upsert: true
    })
    return result
}

export async function save_reports_fight(db: mongodb.Db, browser: puppeteer.Browser, uri: string, ua: string): Promise<WclTables> {
    let coll = db.collection("reports_fight")
    let result = await coll.findOne({
        _id: uri,
    })
    if (result) {
        return result
    }
    let s = `
    $(".composition-entry>a[oncontextmenu]").each(function (_, v) {
        let oncontextmenu = $(v).attr("oncontextmenu").trim()
        if (oncontextmenu.indexOf("return ") == 0) {
            oncontextmenu = oncontextmenu.slice(7).trim()
        }
        if (oncontextmenu) {
            try {
                eval(oncontextmenu)
            } catch (error) {

            }
        }
    })
    `

    console.log("reports_fight", uri)
    let data = await get_page(browser, uri, [s], 'body', ua)
    if (!data) {
        return result
    }
    result = get_reports_fight(data)
    await coll.updateOne(
        {
            _id: uri
        }, {
        $set: { update: new Date(), ...result }
    }, {
        upsert: true
    })
    return result
}

export async function save_reports_fight_source(db: mongodb.Db, browser: puppeteer.Browser, uri: string, ua: string): Promise<WclTables> {
    let coll = db.collection("reports_fight_source")
    let result = await coll.findOne({
        _id: uri,
    })
    if (result) {
        return result
    }

    console.log("reports_fight_source", uri)
    let data = await get_page(browser, uri, [], 'body', ua)
    if (!data) {
        return result
    }
    result = get_reports_fight_source(data)
    await coll.updateOne(
        {
            _id: uri
        }, {
        $set: { update: new Date(), ...result }
    }, {
        upsert: true
    })
    return result
}

export async function save_list(uri: string, ua: string) {
    let d = await axios.get(uri, {
        headers: {
            "User-Agent": ua
        }
    })

    let data = d.data as string
    let $ = cheerio.load(data)
    let items = $(".description-cell>a").map((_, x) => $(x).attr("href")).get()
    items = items.filter(x => x.indexOf("/reports/") == 0)
    items = items.map(x => url.resolve(uri, x))
    let next = $(".pagination .page-link").last().attr("href")
    return {
        items: items,
        next: next,
    }
}

export async function save_rankings(browser: puppeteer.Browser, uri: string, ua: string) {
    let result
    let data = await get_page(browser, uri, [], 'body', ua)
    if (!data) {
        return result
    }
    result = get_rankings(data)
    return result.list.slice(1).map(function (x) {
        let item = x[1]
        if (!item || !item.children) return null
        let report = item.children[0]
        if (!report || !report.children) return null
        report = report.children[1]
        if (!report || !report.href || !report.children) return null
        let id = get_id_from_uri(report.href)
        let name = report.children[0].data || ""
        let uri_ = url.resolve(uri, "/reports/" + id + "#fight=1&type=summary")
        return {
            id,
            name,
            uri: uri_,
        }
    }).filter(x => x && x.id)
}

export async function save_all(db: mongodb.Db, browser: puppeteer.Browser, uri: string, ua: string = "") {
    ua = ua || await browser.userAgent()
    let pending
    pending = await save_rankings(browser, uri, ua)
    if (!pending) return

    outer:
    for (let n in pending) {
        let item = pending[n]
        if (!item) continue
        let data = await save_reports_fight(db, browser, item.uri, ua)
        for (let i in data.composition) {
            let x = data.composition[i]
            x = x.slice(1)
            for (let j in x) {
                let y = x[j]
                if (y.children && y.children.length >= 2 &&
                    y.children[1].href &&
                    y.children[1].children && y.children[1].children[0] && y.children[1].children[0].data == item.name) {
                    await save_reports_fight_source(db, browser, y.children[1].href, ua)
                    continue outer
                }
            }
        }
    }
    return
}