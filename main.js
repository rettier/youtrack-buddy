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

                let issueHtml = issues.map(issue => generateIssueLine(issue)).join('<br>');
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