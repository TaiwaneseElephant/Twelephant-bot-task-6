async function search(query) {
    const response = await fetch(`https://zh.wikipedia.org/w/api.php?action=query&list=search&srnamespace=*&srprop=snippet&srsearch=${query}&formatversion=2`, {
        header: {"user-agent": "Twelephant-bot"}
    }
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

query = 'insource:/\"_addText\": \"\{\{\s*(((db?|c?sd|speedy|delete|[速快][刪删])\s*\|)|db-).*?}}/i contentmodel:json'
