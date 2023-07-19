const http = require('http');
const url = require('url');

const teams = require('./teams.json');
const all_standings = require('./standings.json');

const years = Array.from(new Set(all_standings.map(s => s.year)));
years.sort((b,a) => a-b)
const leagues = Array.from(new Set(all_standings.map(s => s.league)));
const divisions = Array.from(new Set(all_standings.map(s => s.division)));

const serve = (req, res) => {
    const uri = url.parse(req.url).pathname;
    const parts = uri.split('/').splice(1);

    let title;
    if(parts != ""){
        title = parts.join(' - ');
        title = title.substring(0,1).toUpperCase() + title.substring(1);
    }
    else
        title = 'Home';
   
    let html = heading(title);   
    if(parts == "")
        html += homepage();
    if(parts[0] == "teams")
        html += teamspage();
    if(parts[0] == "standings")
        html += standingspage(parts);
    if(html == heading(title)){
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end();
        return;
    }
    html += footing();

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(html);
    
    res.end();
}

const heading = (title) => {
    const html = `
        <!doctype html>
            <html>
                <head>
                    <title>${title}</title>
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.min.css">
                </head>
                <body>
                    <a href='/'>Home</a>
                    <br/>
                    <h1>${title}</h1>
    `;
    return html;
}

const footing = () => {
    return `
        </body>
    </html>
    `;
}

const homepage = () => {
    const text = `
        <p><a href="/teams">Teams</a></p>
        <p>Standings</p>
    `;
    let list = `<ul>`
    for(let i=0; i<years.length; i++){
        list += `
            <li><p><a href="/standings/${years[i]}">${years[i]} Season</a></p>
            <ul>
        `;
        for(let j=0; j<leagues.length; j++){
            list += `
                <li><a href="/standings/${years[i]}/${leagues[j]}">${leagues[j]}</a>
                <ul>
            `;
            for(let k=0; k<divisions.length; k++){
                list += `
                    <li><a href="/standings/${years[i]}/${leagues[j]}/${divisions[k]}">${divisions[k]}</a></li>
                `;
            }
            list += `</ul></li>`;
        }
        list += `</ul></li>`;
    }
    list += `</ul>`;

    return text + list;
}

const teamspage = () => {
    const head = `<table> 
        <thead>
            <tr>
                <th>LOGO</th>
                <th>CITY</th>
                <th>NAME</th>
                <th>CODE</th>
            </tr>
        </thead>`;

    let body = `<tbody>`;
    for(let i=0; i<teams.length; i++){
        body += `
            <tr>
                <td><img height="75" src="${teams[i].logo}"></td>
                <td>${teams[i].city}</td>
                <td>${teams[i].name}</td>
                <td>${teams[i].code}</td>
            </tr>
        `;
    }
    body += `</tbody></table>`;

    return head + body;
}

const standingspage = (parts) => {
    const fteams = filter_teams(parts);
    const head = `<table> 
        <thead>
            <tr>
                <th>LOGO</th>
                <th>CITY</th>
                <th>NAME</th>
                <th>WINS</th>
                <th>LOSSES</th>
            </tr>
        </thead>`;
    let body = `<tbody>`;
    for(let i=0; i<fteams.length; i++){
        const team = teams.filter(t => t.code == fteams[i].team)[0];
        body += `
            <tr>
                <td><img height="75" src="${team.logo}"></td>
                <td>${team.city}</td>
                <td>${team.name}</td>
                <td>${fteams[i].wins}</td>
                <td>${fteams[i].losses}</td>
            </tr>
        `;
    }
    body += `</tbody></table>`;

    return head + body;
}

const filter_teams = (parts) => {
    let filtered = JSON.parse(JSON.stringify(all_standings));
    if(parts.length == 4){
        const f = parts[3];
        filtered = filtered.filter(s => s.division == f);
        parts.pop();
    }
    if(parts.length == 3){
        const f = parts[2];
        filtered = filtered.filter(s => s.league == f);
        parts.pop();
    }
    if(parts.length == 2){
        const f = parts[1];
        filtered = filtered.filter(s => s.year == f);
        parts.pop();
    }

    filtered = filtered.sort((t1,t2) => {
        return t2.wins - t1.wins;
    });

    if(parts.length == 1)
        return filtered;  
}

http.createServer(serve).listen(3000);