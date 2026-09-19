async function search(query_string) {
    const response = await fetch(`https://zh.wikipedia.org/w/api.php?action=query&list=search&srnamespace=*&srprop=snippet&srsearch=${query_string}&formatversion=2&format=json`, {
        headers: {"User-Agent": "Twelephant-bot"}
    });
    if (!response.ok) {
        throw new Error(response.status);
    }
    const data = await response.json();
    console.log(response.headers);
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

async function getConfig() {
    const response = await fetch("https://zh.wikipedia.org/w/index.php?title=User:Twelephant-bot/task/6/config.json&action=raw&ctype=application/json", {
        headers: {"User-Agent": "Twelephant-bot"}
    });
    if (!response.ok) {
        throw new Error(response.status);
    }
    const config = await response.json();
    return config;
}

async function main() {
    const config = await getConfig();
    if (!config.Enable) {
        console.log("Stop");
        return;
    }
    const query_string = config.query_string;
    const header = config.header;
    const item = config.item;
    const footer = config.footer;
    const pattern = new RegExp(config.regex.pattern, config.regex.flag);
    const pages = await search(query_string);
    let content = header;
    for (let page of pages) {
        const match = page[1].match(pattern);
        if (match) {
              content += item.replaceAll("${page}", page[0]).replaceAll("${reason}", match[1]);
        }
    }
    content += footer;
    console.log(content);
}

main();
