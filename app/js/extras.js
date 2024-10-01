function Fetch(url, settings={}) {
    return new Promise(function (res, rej) {
        fetch(url).then(r => {
            if (r.ok) return settings.text ? r.text() : r.json()
            else return r.json()
        })
        .then(r => {
            r.apiError ? rej(r) : res(r)
        })
        .catch(rej)
    });
}


function timeStr(ms, decimals=0, noS, shortTime) {
    if (ms > 3e16) return "Forever"
    function timeFormat(amount, str) {
        amount = +amount
        return `${commafy(amount)} ${str}${noS || amount == 1 ? "" : "s"}`
    }
    ms = Math.abs(ms)
    let seconds = (ms / 1000).toFixed(0)
    let minutes = (ms / (1000 * 60)).toFixed(decimals)
    let hours = (ms / (1000 * 60 * 60)).toFixed(decimals)
    let days = (ms / (1000 * 60 * 60 * 24)).toFixed(decimals)
    let years = (ms / (1000 * 60 * 60 * 24 * 365)).toFixed(decimals)
    if (seconds < 1) return timeFormat((ms / 1000).toFixed(2), shortTime ? "sec" : "second")
    if (seconds < 60) return timeFormat(seconds, shortTime ? "sec" : "second")
    else if (minutes < 60) return timeFormat(minutes, shortTime ? "min" : "minute")
    else if (hours <= 24) return timeFormat(hours, "hour")
    else if (days <= 365) return timeFormat(days, "day")
    else return timeFormat(years, "year")
}

function addUhOh() {
    $('body').append(`<div id="uhoh" class="centerflex" style="display: none; flex-direction: column;">
    <h2 id="errorheader">Error :(</h2>
    <p id="errorfooter"></p>
    <button id="loginbutton" onclick="loginButton()">Log in</button>
    </div>`)
}

function loginButton() {
    localStorage.polaris_url = window.location.pathname
    window.location.href = "/discord"
}

let mobile = ( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) )   