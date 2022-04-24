const ready = loaded => {
    if (['interactive', 'complete'].includes(document.readyState)) {
        loaded();
    } else {
        document.addEventListener('DOMContentLoaded', loaded);
    }
};

const CopyToClipboard = data => {
    navigator.clipboard.writeText(data);
};

const openTab = (evt, id) => {
    const tabcontent = document.getElementsByClassName('tabcontent');
    for (const i of tabcontent) i.style.display = 'none';
    const tablinks = document.getElementsByClassName('tablinks');
    for (const i of tablinks) i.className = i.className.replace(' active', '');
    document.getElementById(id).style.display = 'block';
    evt.currentTarget.className += ' active';
};

const AnnoToJP = () => {
    document.getElementById('calc_jp').addEventListener('click', () => {
        const param = { date: document.getElementById('anno_date').value };
        const queryParam = new URLSearchParams(param);
        fetch('./api/japanese?' + queryParam)
            .then(res => res.json())
            .then(r => {
                document.getElementById('result_jp_text').value =
                    r.era.long + r.calendar.year + '年' + r.calendar.month + '月' + r.calendar.day + '日';
                document.getElementById('result_jp').style.display = 'block';
            })
            .catch(e => console.log(e));
    });
};

const JPToAnno = () => {
    fetch('./api/japanese/eras')
        .then(res => res.json())
        .then(r => {
            const era = document.getElementById('jp_era');
            m.mount(era, { view: () => r.eras.map(e => m('option', { value: e.kanji }, e.kanji)) });
            era.selectedIndex = era.options.length - 1;
        })
        .catch(e => console.log(e));
    document.getElementById('calc_anno').addEventListener('click', () => {
        const toTwoDigit = val => (parseInt(val) < 10 ? '0' : '') + val;
        const param = {
            date:
                document.getElementById('jp_era').value +
                document.getElementById('jp_year') +
                '.' +
                toTwoDigit(document.getElementById('jp_month').value) +
                '.' +
                toTwoDigit(document.getElementById('jp_day').value),
        };
        const queryParam = new URLSearchParams(param);
        fetch('/api/anno_domini' + queryParam)
            .then(res => res.json())
            .then(r => {
                document.getElementById('result_anno_text').value = r.year + '年' + r.month + '月' + r.day + '日';
                document.getElementById('result_anno').style.display = 'block';
            })
            .catch(e => console.log(e));
    });
};

const SetupCopyButton = () => {
    $(document).ready(() => {
        toastr.options.timeOut = 3000; // 3秒
        toastr.options = {
            closeButton: true,
            debug: false,
            newestOnTop: false,
            progressBar: false,
            positionClass: 'toast-bottom-right',
            preventDuplicates: false,
            showDuration: '300',
            hideDuration: '1000',
            timeOut: '5000',
            extendedTimeOut: '1000',
            showEasing: 'swing',
            hideEasing: 'linear',
            showMethod: 'fadeIn',
            hideMethod: 'fadeOut',
        };
        document.getElementById('copy_to_clipboard1').addEventListener('click', () => {
            CopyToClipboard(document.getElementById('result_jp_text').value);
            toastr['success']('クリップボードにコピーしました', '成功');
        });
        document.getElementById('copy_to_clipboard2').addEventListener('click', () => {
            CopyToClipboard(document.getElementById('result_anno_text').value);
            toastr['success']('クリップボードにコピーしました', '成功');
        });
    });
};

const LoadAPIReference = () => {
    fetch('./api_reference.md')
        .then(res => res.text())
        .then(r => {
            const markdown = marked.parse(r);
            document.getElementById('api_reference').innerHTML = markdown;
        })
        .catch(er => console.log(er));
};

ready(() => {
    LoadAPIReference();
    AnnoToJP();
    JPToAnno();
    SetupCopyButton();
    document.getElementById('defaultOpen').click();
});
