const express = require('express');
const app = express();
const fse = require('fs/promises');
const JapaneseCalendarBorder = require('./japanese_calendar_border_table');
const Borders = new Array();

const main = async() => {
    const calendar = JSON.parse(await fse.readFile("./japanese_calendar.json").catch(er => {
        console.error("Fail to open japanese_calendar.json", er);
		process.exit(1);
    }));
    calendar.borders.forEach(c => {
       Borders.push(new JapaneseCalendarBorder(c.jcalendar, c.jalphabet, c.begin));
    });

    const isValidDate = (val) => {
        const YearVal = Math.floor(val / 10000);
        const MonthVal = Math.floor((val % 10000) / 100);
        const DayVal = val % 100;
        if (MonthVal < 1 || 12 < MonthVal || DayVal < 1) return false;
        if (MonthVal === 2) {
            if (YearVal % 4 === 0) {
                if (YearVal % 100 === 0) return DayVal <= (YearVal % 400 === 0 ? 29 : 28);
                else return DayVal <= 29;
            }
            else return DayVal <= 28;
        }
        else if (MonthVal === 4 || MonthVal === 6 || MonthVal === 9 || MonthVal === 11) return DayVal <= 30;
        else return DayVal <= 31;
    };
    
    const createJapaneseCalendarResponseJsonImpl = (border, year, month, day) => 
        JSON.stringify({
            jcalendar: border.m_jcalendar,
            jalphabet: border.m_alphabet,
            year: (year - border.m_border.year + 1),
            mon: month,
            day: day
        });
    
    const cgetJapaneseCalendarData = (YearVal, MonthVal, DayVal) => {
        var i = 0;
        for (; i < Borders.length && Borders[i].m_border.cless_equal(YearVal, MonthVal, DayVal); i++) {}
        return Borders[--i];
    };
    
    const ccreateJapaneseCalendarResponseJson = (AnnoDominiYear, MonthVal, DayVal) => 
        createJapaneseCalendarResponseJsonImpl(cgetJapaneseCalendarData(AnnoDominiYear, MonthVal, DayVal), AnnoDominiYear, MonthVal, DayVal);
    
    const createJapaneseCalendarResponseJson = (data) => 
        ccreateJapaneseCalendarResponseJson(Math.floor(data / 10000), Math.floor((data % 10000) / 100), data % 100);

    const getLastDate = (NextEraBorderInfo) => {
        var d = new Date(NextEraBorderInfo.year, NextEraBorderInfo.month, NextEraBorderInfo.day);
        d.setDate(d.getDate() - 1);
        return d;
    };
    const getBorderDataFromEra = (era) => {
        for (var i = 0; i < Borders.length - 1; i++) {
            if (era.toUpperCase() === Borders[i].m_alphabet || era === Borders[i].m_jcalendar) {
                const LastDate = getLastDate(Borders[i + 1].m_border);
                return {
                    begin: {
                        year: Borders[i].m_border.year,
                        month: Borders[i].m_border.month,
                        day: Borders[i].m_border.day
                    },
                    end: {
                        year: LastDate.getFullYear(),
                        month: LastDate.getMonth(),
                        day: LastDate.getDate()
                    }
                };
            }
        }
        if (era.toUpperCase() === Borders[Borders.length - 1].m_alphabet || era === Borders[Borders.length - 1].m_jcalendarB) {
            const Today = new Date();
            return {
                begin: {
                    year: Borders[i].m_border.year,
                    month: Borders[i].m_border.month,
                    day: Borders[i].m_border.day
                },
                end: {
                    year: Today.getFullYear(),
                    month: Today.getMonth() + 1,
                    day: Today.getDate()
                }
            };
        }
        return null;
    };

    app.get('/api/japanese', (req, res) => {
        if (req.query.date != null) {
            var Cal = new Date();
            if (!isNaN(req.query.difference_from_today)) {
                v = parseInt(req.query.difference_from_today);
                if (!isNaN(v)) Cal.setDate(Cal.getDate() + v);
            }
            res.send(ccreateJapaneseCalendarResponseJson(Cal.getFullYear(), Cal.getMonth() + 1, Cal.getDate()));
        }
        else {
            const dateVal = parseInt(req.query.date);
            if (isNaN(dateVal)) return res.sendStatus(400);
            if (!isValidDate(dateVal) || dateVal < 19000101) return res.sendStatus(400);
            res.send(createJapaneseCalendarResponseJson(dateVal));
        }
    });
    app.get('/api/japanese/eras', (_, res) => {
        var arr = new Array();
        Borders.forEach(b => {
            arr.push({
                alphabet: b.m_alphabet,
                kanji: b.m_jcalendar
            });
        });
        res.send(JSON.stringify({ eras: arr }));
    });
    app.get('/api/japanese/border', (req, res) => {
        if (req.query.era === null) return res.sendStatus(400);
        const border = getBorderDataFromEra(req.query.era);
        if (border === null) return res.sendStatus(404);
        return res.send(JSON.stringify({
            begin: {
                year: 1,
                month: border.begin.month,
                day: border.begin.day
            },
            end: {
                year: border.end.year - border.begin.year + 1,
                month: border.end.month,
                day: border.end.day
            }
        }));
    });
    app.get('/api/japanese/max_year', (req, res) => {
        if (req.query.era === null) return res.sendStatus(400);
        for (var i = 0; i < Borders.length - 1; i++) {
            if (req.query.era.toUpperCase() === Borders[i].m_alphabet || req.query.era === Borders[i].m_jcalendar) {
                const StartYear = Borders[i].m_border.year;
                const LastYear = getLastDate(Borders[i + 1].m_border).getFullYear();
                return res.send(JSON.stringify({ max_year: (LastYear - StartYear + 1) }));
            }
        }
        if (req.query.era.toUpperCase() === Borders[i].m_alphabet || req.query.era === Borders[i].m_jcalendar) {
            const Today = new Date();
            return res.send(JSON.stringify({ max_year: (Today.getFullYear() - Borders[i].m_border.year + 1) }));
        }
        return res.sendStatus(404);
    });
    app.get('/api/japanese/month', (req, res) => {
        if (req.query.year === null) return res.sendStatus(400);
        const era = req.query.year.substring(0, 1);
        const yearBase = parseInt(req.query.year.substring(1));
        if (isNaN(yearBase) || yearBase < 1) return res.sendStatus(400);
        const border = getBorderDataFromEra(era);
        const year = yearBase + border.begin.year - 1;
        if (border === null || year > border.end.year) return res.sendStatus(404);
        return res.send(JSON.stringify({
            min: year === border.begin.year ? border.begin.month : 1,
            max: year === border.end.year ? border.end.month : 12
        }));
    });
    app.get('/api/japanese/day', (req, res) => {
        if (req.query.year === null || req.query.month) return res.sendStatus(400);
        const era = req.query.year.substring(0, 1);
        const yearBase = parseInt(req.query.year.substring(1));
        const mon = parseInt(req.query.month);
        if (isNaN(yearBase) || isNan(mon) || mon < 1 || mon > 12 || yearBase < 1) return res.sendStatus(400);
        const border = getBorderDataFromEra(era);
        const year = yearBase + border.begin.year - 1;
        if (border === null || year > border.end.year) res.sendStatus(404);

    });
    app.get('/api/anno_domini', (req, res) => {
        var Cal = new Date();
        if (req.query.difference_from_today != null) {
            v = parseInt(req.query.difference_from_today);
            if (!isNaN(v)) Cal.setDate(Cal.getDate() + v);
        }
        const resJson = {
            year: Cal.getFullYear(),
            mon: (Cal.getMonth() + 1),
            day: Cal.getDate()
        };
        res.send(JSON.stringify(resJson));
    });
    app.use(express.static('wwwroot'));
    app.use(express.json( { type:'application/*+json'}));
    app.listen(process.env.HTTP_PLATFORM_PORT || 8900);
};

main().catch(er => {
	console.error(er);
	process.exit(1);
});