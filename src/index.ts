
import puppeteer from 'puppeteer-core'
import { save_all } from './saveing'
import mongodb from 'mongodb'
import { changeUrlHostToUseIp } from './utils'

let mongo_env = process.env["MONGO"] || 'mongodb://127.0.0.1:27017/wcl'
let headless_env = process.env["HEADLESS"] || 'http://127.0.0.1:9222'
let terget_env = process.env["TERGET"] || 'https://cn.warcraftlogs.com/zone/reports?zone=23&boss=0&difficulty=0&class=Any&spec=Any&keystone=0&kills=0&duration=0'



async function main() {
    const mgo = await mongodb.connect(mongo_env, { useUnifiedTopology: true, useNewUrlParser: true })
    const db = await mgo.db()

    const browser = await puppeteer.connect({
        browserURL: await changeUrlHostToUseIp(headless_env)
    })
    // const browser = await puppeteer.launch({
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
        await save_all(db, browser, terget_env)
        console.log('step')
    }
    // await browser.close()
}

main()
