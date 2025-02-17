let styleReset = `<span style="font-size: 14pt; font-family: Roboto, sans-serif; color: rgb(255, 255, 255); font-variant-numeric: normal; font-variant-east-asian: normal; font-variant-alternates: normal; font-variant-position: normal; font-variant-emoji: normal; vertical-align: baseline; white-space-collapse: preserve;">`;

function _getIssueIdFromDetailPage() {
    let el = $("[class^='ticketContent_']");
    if (el) {
        let issueId = $(el).find("[id^='id-link']").text();
        if (!issueId) {
            return;
        }
        return issueId;
    }
}

function getIssueIdFromIssueList() {
    // class yt-issue and .selected or .focused
    let idsSelected = [];
    let idsFocused = [];

    $(".yt-issue.selected, .yt-issue.focused").each(function (index) {
        let id = $(this).find(".yt-issue-id").text();
        if (!id || !id.length)
            return;
        if ($(this).hasClass("selected")) {
            idsSelected.push(id);
        } else {
            idsFocused.push(id);
        }
    });

    return idsSelected.length ? idsSelected : idsFocused;
}

function getIssueIdFromAgileBoardCard() {
    let idsSelected = [];
    let idsFocused = [];

    // same as from list but .yt-agile-card and .yt-agile-card_selected and .yt-agile-card_focused
    $(".yt-agile-card.yt-agile-card_selected, .yt-agile-card.yt-agile-card_focused").each(function (index) {
        let id = $(this).find(".yt-issue-id").text();
        if (!id || !id.length)
            return;
        if ($(this).hasClass("yt-agile-card_selected")) {
            idsSelected.push(id);
        } else {
            idsFocused.push(id);
        }
    });

    return idsSelected.length ? idsSelected : idsFocused;
}

async function resolveIssueIds(issueIds) {
    let token = undefined;
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key.endsWith('-token') && !key.startsWith('0-0-0-0')) {
            token = JSON.parse(localStorage.getItem(key))["accessToken"];
            break;
        }
    }
    let apiCalls = [];
    for (let id of issueIds) {
        apiCalls.push(fetch(`/api/issues/${id}?fields=idReadable,summary,tags(name,color(background)),fields(name,value(name,color(foreground,background)))`,
            {
                method: 'GET',
                headers: {
                    "Authorization": "Bearer " + token
                }
            }));
    }
    let responses = await Promise.all(apiCalls);
    let data = [];
    for (let response of responses) {
        let json = await response.json();
        data = data.concat(json);
    }

    let result = [];
    for (let issue of data) {
        let convertedIssue = {
            id: issue.idReadable, summary: issue.summary.trim(),
            tags: issue.tags.map(x => ({name: x.name, color: x.color.background}))
        };
        for (let field of issue.fields) {
            if (field.name === "Priority") {
                convertedIssue.priority = (field.value.name || "?")[0].toLocaleUpperCase();
                convertedIssue.color = field.value.color.foreground;
                convertedIssue.background = field.value.color.background;
            }
        }
        result.push(convertedIssue);
    }
    return result;
}

function getSelectedIssues() {
    let issue = _getIssueIdFromDetailPage();
    if (issue) {
        return [issue];
    }

    let issues = getIssueIdFromIssueList();
    if (issues.length) {
        return issues;
    }

    issues = getIssueIdFromAgileBoardCard();
    if (issues.length) {
        return issues;
    }

    return [];
}

function generateIssueLine({priority, id, summary, color, background, tags}) {
    const paddingLeft = '';
    const paddingRight = ''

    let tagsString = "";
    for (let i = 0; i < tags.length; i++) {
        let tag = tags[i];
        let comma = i < (tags.length - 1) ? ', ' : '';
        let first = i === 0 ? ' ' : '';
        tagsString += `<span style="font-size: 14pt; font-family: Roboto, sans-serif; color: ${tag.color}; font-weight: 700; font-variant-numeric: normal; font-variant-east-asian: normal; font-variant-alternates: normal; font-variant-position: normal; font-variant-emoji: normal; vertical-align: baseline; white-space-collapse: preserve;">\
<span style="font-size:0.6em;vertical-align:super;">${first}${tag.name}${comma}</span></span>`
    }

    return `\
<span style="font-size: 14pt; font-family: 'Roboto', sans-serif; color: rgb(255, 255, 255); background-color: ${background}; vertical-align: baseline;">&nbsp;</span>\
<span style="font-size: 14pt; font-family: 'Roboto Mono', monospace; color: ${color}; background-color: ${background}; vertical-align: baseline;">${priority}</span>\
<span style="font-size: 14pt; font-family: 'Roboto', sans-serif; color: rgb(255, 255, 255); background-color: ${background}; vertical-align: baseline;">&nbsp;</span>\
<span style="font-size: 14pt; font-family: 'Roboto', sans-serif; color: rgb(255, 255, 255); vertical-align: baseline;"> </span>\
<span style="font-size: 14pt; font-family: 'Roboto Mono', monospace; color: rgb(74, 195, 184); text-decoration-skip-ink: none; vertical-align: baseline;">${paddingLeft}</span>\
<a href="https://youtrack.acc.si/issue/${id}" style="text-decoration-line: none;">\
<span style="font-size: 14pt; font-family: 'Roboto Mono', monospace; color: rgb(74, 195, 184); text-decoration-line: underline; text-decoration-skip-ink: none; vertical-align: baseline;">${id}</span>\
</a>\
<span style="font-size: 14pt; font-family: 'Roboto Mono', monospace; color: rgb(74, 195, 184); text-decoration-skip-ink: none; vertical-align: baseline;">${paddingRight}</span>\
<span style="font-size: 14pt; font-family: 'Roboto', sans-serif; color: rgb(255, 255, 255); vertical-align: baseline;"> ${summary}</span>${tagsString}\
`;
}

//console.log(`<p dir="ltr" style="line-height:1.1;margin-top:0pt;margin-bottom:12pt;">`);
//console.log(generateTestModule('S', 'CRM-123', 'This is a test error message'));
//console.log(generateTestModule('L', 'OM-1234', 'This is a test error message'));
//console.log(`</p>`);
