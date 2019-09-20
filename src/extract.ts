import cheerio from 'cheerio'

export interface Obj {
    type: string
    data?: string
    href?: string
    src?: string
    children?: Obj[]
}

export class WclTables {
    [index: string]: Obj[][]
}

export class WclItems {
    [index: string]: string[]
}

function html2json(h: CheerioElement): Obj | null {
    switch (h.type) {
        default:
            throw "undefine type ${h.type}"
        case "text":
            let data = (h.data || "").trim()
            if (!data) {
                return null
            }
            return {
                type: h.type,
                data: data,
            }
        case "tag":
            break
    }

    switch (h.name) {
        case "a":
            let href = h.attribs["href"]
            return {
                type: h.name,
                href: href,
                children: h.children.map(html2json).filter(x => x),
            } as Obj
        case "img":
            return {
                type: h.name,
                src: h.attribs["src"],
                children: h.children.map(html2json).filter(x => x),
            } as Obj
        default:
            let children = h.children.map(html2json).filter(x => x)
            if (!children || !children.length) {
                return null
            }
            return {
                type: h.name,
                children: children,
            } as Obj
    }
}

export function get_struct_table_data($: CheerioStatic, sel: string): Obj[][] {
    let tr = $(sel).find("tr")

    let results: Obj[][] = []
    tr.each(
        function (_, el0) {
            let item: Obj[] = $(el0).children().not("script").map(
                function (_, el1) {
                    return el1.children.map(html2json).filter(x => x)
                }
            ).get()
            results.push(item)
        }
    )
    return results
}

export function get_struct_data($: CheerioStatic, sel: string): Obj[] {
    return $(sel).map((_, x) => html2json(x)).get()
}

export function get_reports(content: string) {
    let $ = cheerio.load(content)
    let items = $("a.report-overview-boss-caption").map((_, x) => $(x).attr("href")).get()
    items = items.filter(x => x.lastIndexOf("#fight=") != -1)
    let guild = get_struct_data($, "#guild-reports-text")
    let owner = get_struct_data($, "#report-header-owner-text")

    return {
        items,
        guild,
        owner,
    }
}

export function get_reports_fight(content: string) {
    let $ = cheerio.load(content)
    let composition = get_struct_table_data($, "table.composition-table")
    let damage_done = get_struct_table_data($, "#summary-damage-done-0")
    let healing_done = get_struct_table_data($, "#summary-healing-done-0")
    let damage_taken = get_struct_table_data($, "#summary-damage-taken-0")
    let deaths = get_struct_table_data($, "#summary-deaths-0")
    let boss = get_struct_data($, "#filter-fight-boss-text")
    let guild = get_struct_data($, "#guild-reports-text")
    let owner = get_struct_data($, "#report-header-owner-text")

    return {
        composition,
        damage_done,
        healing_done,
        damage_taken,
        deaths,
        boss,
        guild,
        owner
    }
}

export function get_reports_fight_source(content: string) {
    let $ = cheerio.load(content)

    let talents = get_struct_table_data($, "#summary-talents-0")
    let artifact = get_struct_table_data($, "#summary-artifact-0")
    let gear = get_struct_table_data($, "#summary-gear-0")
    let damage_done = get_struct_table_data($, "#summary-damage-done-0")
    let healing_done = get_struct_table_data($, "#summary-healing-done-0")
    let damage_taken = get_struct_table_data($, "#summary-damage-taken-0")
    let deaths = get_struct_table_data($, "#summary-deaths-0")
    let guild = get_struct_data($, "#guild-reports-text")
    let owner = get_struct_data($, "#report-header-owner-text")


    return {
        talents,
        artifact,
        gear,
        damage_done,
        healing_done,
        damage_taken,
        deaths,
        guild,
        owner,
    }
}


export function get_rankings(content: string) {
    let $ = cheerio.load(content)

    let list = get_struct_table_data($, "#DataTables_Table_0")

    return {
        list,
    }
}

export function get_id_from_uri(uri: string) {
    let reg = /reports\/([\w]+)/
    let result = reg.exec(uri)
    if (result && result[1]) {
        return result[1]
    }
    return ""
}