
import puppeteer from 'puppeteer-core'
import { save_all } from './saveing'
import mongodb from 'mongodb'
import { changeUrlHostToUseIp } from './utils'

let mongo_env = process.env["MONGO"] || 'mongodb://127.0.0.1:27017/wcl'
let headless_env = process.env["HEADLESS"] || 'http://127.0.0.1:9222'
let terget_env = process.env["TERGET"] || 'https://cn.warcraftlogs.com/zone/reports?zone=23&boss=0&difficulty=0&class=Any&spec=Any&keystone=0&kills=0&duration=0'
let useragent_env = process.env["USERAGENT"] || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'


async function main() {
    let browser
    let mgo
    try {
        mgo = await mongodb.connect(mongo_env, { useUnifiedTopology: true, useNewUrlParser: true })
        let db = mgo.db()

        browser = await puppeteer.connect({
            browserURL: await changeUrlHostToUseIp(headless_env)
        })
        // let browser = await puppeteer.launch({
        //     // timeout: 100000,
        //     headless: true,
        //     ignoreHTTPSErrors: true,
        //     args: [
        //         '--disable-gpu',
        //         '--disable-dev-shm-usage',
        //         '--disable-setuid-sandbox',
        //         '--no-first-run',
        //         '--no-sandbox',
        //         '--no-zygote',
        //         '--single-process',
        //     ],
        //     handleSIGINT: true,
        //     handleSIGTERM: true,
        //     handleSIGHUP: true,
        //     // dumpio: true,
        // })
        for (; ;) {
            await save_all(db, browser, terget_env, useragent_env)
            console.log('step')
        }
    } catch (error) {
        console.log(error)
    } finally {
        if (browser) browser.disconnect()
        if (mgo) await mgo.close()
    }
}

main()
