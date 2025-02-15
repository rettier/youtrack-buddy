// ==UserScript==
// @name         Youtrack Buddy
// @namespace    http://acc.si/
// @version      2025-02-13
// @description  A tool for youtrack
// @author       Arivo
// @match        https://youtrack.acc.si/*
// @icon         http://design.acc.si/Arivo_A_blautrans_sehrklein.png
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    //let styleReset = `<span style="font-size: 14pt; font-family: Roboto, sans-serif; color: rgb(255, 255, 255); font-variant-numeric: normal; font-variant-east-asian: normal; font-variant-alternates: normal; font-variant-position: normal; font-variant-emoji: normal; vertical-align: baseline; white-space-collapse: preserve;">`;

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
    for(let id of issueIds) {
        apiCalls.push(fetch(`/api/issues/${id}?fields=idReadable,summary,fields(name,value(name,color(foreground,background)))`,
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
        let convertedIssue = {id: issue.idReadable, summary: issue.summary.trim()};
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

function generateIssueLine(priority, issueNumber, string, color, backgroundColor) {
    const prefix = issueNumber.split('-')[0];
    const number = issueNumber.split('-')[1];

    const paddingLeft = '';
    const paddingRight = ''

    return `\
<span style="font-size: 14pt; font-family: 'Roboto', sans-serif; color: rgb(255, 255, 255); background-color: ${backgroundColor}; vertical-align: baseline;">&nbsp;</span>\
<span style="font-size: 14pt; font-family: 'Roboto Mono', monospace; color: ${color}; background-color: ${backgroundColor}; vertical-align: baseline;">${priority}</span>\
<span style="font-size: 14pt; font-family: 'Roboto', sans-serif; color: rgb(255, 255, 255); background-color: ${backgroundColor}; vertical-align: baseline;">&nbsp;</span>\
<span style="font-size: 14pt; font-family: 'Roboto', sans-serif; color: rgb(255, 255, 255); vertical-align: baseline;"> </span>\
<span style="font-size: 14pt; font-family: 'Roboto Mono', monospace; color: rgb(74, 195, 184); text-decoration-skip-ink: none; vertical-align: baseline;">${paddingLeft}</span>\
<a href="https://youtrack.acc.si/issue/${issueNumber}" style="text-decoration-line: none;">\
<span style="font-size: 14pt; font-family: 'Roboto Mono', monospace; color: rgb(74, 195, 184); text-decoration-line: underline; text-decoration-skip-ink: none; vertical-align: baseline;">${issueNumber}</span>\
</a>\
<span style="font-size: 14pt; font-family: 'Roboto Mono', monospace; color: rgb(74, 195, 184); text-decoration-skip-ink: none; vertical-align: baseline;">${paddingRight}</span>\
<span style="font-size: 14pt; font-family: 'Roboto', sans-serif; color: rgb(255, 255, 255); vertical-align: baseline;"> ${string}</span>\
`;
}

//console.log(`<p dir="ltr" style="line-height:1.1;margin-top:0pt;margin-bottom:12pt;">`);
//console.log(generateTestModule('S', 'CRM-123', 'This is a test error message'));
//console.log(generateTestModule('L', 'OM-1234', 'This is a test error message'));
//console.log(`</p>`);
function registerShortcuts() {
    // register alt+c keyboard shortcut
    document.addEventListener('keydown', function (event) {
        if (event.altKey && event.key === 'c') {
            let issues = getSelectedIssues();
            if (!issues.length) {
                console.log('%cNo issue(s) found', 'color: red; 16px; font-weight: bold;');
                return;
            }

            resolveIssueIds(issues).then(issues => {
                // sort by known priorities, then by id
                let priorities = ['1', 'S', '2', 'H', 'M', '3', 'N', '4', 'L'];
                issues.sort((a, b) => {
                    let aPriority = priorities.indexOf(a.priority);
                    let bPriority = priorities.indexOf(b.priority);
                    if (aPriority === bPriority) {
                        return a.id.localeCompare(b.id);
                    }
                    return aPriority - bPriority;
                });

                let issueHtml = issues.map(issue => generateIssueLine(issue.priority, issue.id, issue.summary, issue.color, issue.background)).join('<br>');
                if (issues.length > 1) {
                    let pStart = `<p dir="ltr" style="line-height:1.15;margin-top:0pt;margin-bottom:12pt;">`;
                    let pEnd = '</p>';
                    issueHtml = pStart + issueHtml + pEnd;
                }

                GM_setClipboard(issueHtml, 'html');
            });
        }
    });
}

function documentReady() {
    console.log(`%cYT Buddy is started`, 'color: green; font-size: 16px; font-weight: bold;');
    registerShortcuts();
}

function ytBuddyStart() {
    $(document).ready(documentReady);
}

    ytBuddyStart();
})();
