async function search(query_string, headers) {
    const response = await fetch(`https://zh.wikipedia.org/w/api.php?action=query&list=search&srnamespace=*&srprop=snippet&srsearch=${encodeURIComponent(query_string)}&assertuser=Twelephant-bot&formatversion=2&format=json`, {
        headers: headers
    });
    if (!response.ok) {
        throw new Error(response.status);
    }
    const data = await response.json();
    if (data.error) {
        throw new Error(data.error.code);
    }
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

function setHeaders(response, cookies) {
    let headers =  {"User-Agent": "Twelephant-bot"};
    for (const [key, value] of Object.entries(getCookies(response))) {
        cookies[key] = value;
    }
    Cookieslist = [];
    for (const [key, value] of Object.entries(cookies)) {
        Cookieslist.push(`${key}=${value}`);
    }
    headers.Cookie = Cookieslist.join("; ")
    return [headers, cookies];
}

function getCookies(response) {
    let cookies = {};
    for (let cookie of response.headers.getSetCookie()) {
        const split = cookie.split(";")[0].split("=", 2);
        cookies[split[0].trim()] = split[1].trim();
    }
    return cookies;
}

async function getConfig() {
    const response = await fetch("https://zh.wikipedia.org/w/index.php?title=User:Twelephant-bot/task/6/config.json&action=raw&ctype=application/json", {
        headers: {"User-Agent": "Twelephant-bot"}
    });
    if (!response.ok) {
        throw new Error(response.status);
    }
    const config = await response.json();
    const [headers, cookies] = setHeaders(response, {});
    return [config, headers, cookies];
}

async function getToken(type, headers, cookies) {
    const response = await fetch(`https://zh.wikipedia.org/w/api.php?action=query&meta=tokens&type=${type}&formatversion=2&format=json`, {
        headers: headers
    });
    if (!response.ok) {
        throw new Error(response.status);
    }
    const data = await response.json();
    const token = data.query.tokens[`${type}token`];
    [headers, cookies] = setHeaders(response, cookies);
    return [token, headers, cookies];
}

async function login(name, pwd, headers, cookies) {
    let logintoken, newheaders
    [logintoken, newheaders, cookies] = await getToken("login", headers, cookies);
    newheaders["Content-Type"] = "application/x-www-form-urlencoded"
    const response = await fetch(`https://zh.wikipedia.org/w/api.php?action=login&formatversion=2&format=json`, {
        method: "POST",
        headers: newheaders,
        body: new URLSearchParams({lgname: name, lgpassword: pwd, lgtoken: logintoken}).toString()
    });
    if (!response.ok) {
        throw new Error(response.status);
    }
    const data = await response.json();
    if (!data.login || data.login.result != "Success") {
        throw new Error("Login Failed");
    }
    return setHeaders(response, cookies);
}

async function main() {
    let [config, headers, cookies] = await getConfig();
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
    [headers, cookies] = await login(secret.ACCOUNT, secret.BOTPWD, headers, cookies);
    const pagelist = await search(query_string, headers);
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
