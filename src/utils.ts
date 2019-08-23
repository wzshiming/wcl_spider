import url from 'url'
import { promisify } from 'util'
import { lookup } from 'dns'
const lookupAsync = promisify(lookup);

export async function changeUrlHostToUseIp(urlString: string) {
    const urlParsed = url.parse(urlString);
    if (!urlParsed.hostname) {
        return urlString
    }
    const { address: hostIp } = await lookupAsync(urlParsed.hostname);
    delete urlParsed.host;
    urlParsed.hostname = hostIp;
    return url.format(urlParsed);
}