async function search(query_string, cookies) {
    const response = await fetch(`https://zh.wikipedia.org/w/api.php?action=query&list=search&srnamespace=*&srprop=snippet&srsearch=${encodeURIComponent(query_string)}&formatversion=2&format=json`, {
        headers: setHeaders(cookies)
    });
    if (!response.ok) {
        throw new Error(response.status);
    }
    const data = await response.json();
    console.log(response.headers.getSetCookie());
    let result = [];
    for (let page of data.query.search) {
        const match = page.snippet.match(/<span class="searchmatch">(.+?)<\/span>/);
        if (match) {
            const text = match[1];
            console.log(text);
            result.push([page.title, text]);
        }
    }
    return result; 
}

async function setHeaders(cookies) {
    let headers = new Headers();
    let headers.append("User-Agent", "Twelephant-bot")
    for (let cookie of cookies) {
        headers.append("Set-Cookie", cookie);
    }
    return headers;
}

async function getConfig() {
    const response = await fetch("https://zh.wikipedia.org/w/index.php?title=User:Twelephant-bot/task/6/config.json&action=raw&ctype=application/json", {
        headers: {"User-Agent": "Twelephant-bot"}
    });
    if (!response.ok) {
        throw new Error(response.status);
    }
    const config = await response.json();
    const cookies = response.headers.getSetCookie();
    return [config, cookies];
}

async function getToken(type, cookies) {
    const response = await fetch(`https://zh.wikipedia.org/w/api.php?action=query&meta=tokens&type=${type}&formatversion=2&format=json`, {
        headers: setHeaders(cookies)
    });
    if (!response.ok) {
        throw new Error(response.status);
    }
    const data = await response.json();
    const token = data.query.tokens[`${type}token`];
    return token;
}

async function login(name, pwd, cookies) {
    const logintoken = await getToken("login", cookies);
    const response = await fetch(`https://zh.wikipedia.org/w/api.php?action=login&formatversion=2&format=json`, {
        method: "POST",
        headers: setHeaders(cookies),
        body: JSON.stringify({lgname: name, lgpassword: pwd, lgtoken: logintoken})
    });
    if (!response.ok) {
        throw new Error(response.status);
    }
}

async function main() {
    const [config, cookies] = await getConfig();
    if (!config.Enable) {
        console.log("Stop");
        return;
    }
    const page = config.page;
    const query_string = config.query_string;
    const header = config.header;
    const item = config.item;
    const footer = config.footer;
    const pattern = new RegExp(config.regex.pattern, config.regex.flag);
    const { readFile } = require("node:fs/promises");
    const secret = JSON.parse(await readFile("password.json"));
    await login(secret.ACCOUNT, secret.BOTPWD, cookies);
    const pagelist = await search(query_string, cookies);
    let content = header;
    for (let [name, text] of pagelist) {
        const match = text.match(pattern);
        if (match) {
              content += item.replaceAll("${page}", name).replaceAll("${reason}", match[1]);
        }
    }
    content += footer;
    console.log(content);
}

main();
