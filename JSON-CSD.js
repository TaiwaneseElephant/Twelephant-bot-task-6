async function search(query_string) {
    const response = await fetch(`https://zh.wikipedia.org/w/api.php?action=query&list=search&srnamespace=*&srprop=snippet&srsearch=${query_string}&formatversion=2`, {
        headers: {userAgent: "Twelephant-bot"}
    });
    if (!response.ok) {
        throw new Error(response.status);
    }
    const data = await response.json();
    let result = [];
    for (let page of data.query.search) {
      result.push([page.title, page.snippet.match(/<span class=\"searchmatch\">.+</span>/)]);
    }
    return result; 
}

async function getConfig() {
    const response = await fetch("https://zh.wikipedia.org/w/index.php?title=User:Twelephant-bot/task/6/config.json&action=raw&ctype=application/json", {
        headers: {userAgent: "Twelephant-bot"}
    }
    if (!response.ok) {
        throw new Error(response.status);
    }
    const config = await response.json();
    if (!config.Enable) {
        return;
    }
    const query_string = config.query_string;
    const header = config.header;
    const item = config.item;
    const footer = config.footer;
    const pattern = config.pattern;
    const data = await search(query_string);
    let content = header;
    for (let page of data.query.search) {
      content += item % (page[0], page[1].match(pattern)[1]);
    }
    content += footer;
    console.log(content);
}

