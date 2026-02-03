import {
    getSelectedEvent,
    getEntriesByEventAndCategory,
    getScoresForTimetablePart,
    getEntryWithPopulation
} from '../DataServices/resultCalculationsData.js';

export async function FirstLevel(resultGroupDoc, part) {
    const event = await getSelectedEvent();
    const entries = await getEntriesByEventAndCategory(event?._id, resultGroupDoc.category);
    const timetablePartID = part === 'R1F' ? resultGroupDoc.round1First :
                          part === 'R1S' ? resultGroupDoc.round1Second :
                          part === 'R2F' ? resultGroupDoc.round2First : null;

    const results = await getScoresForTimetablePart(entries.map(e => e._id), timetablePartID);

    const title = part === 'R1F' ? 'Round 1 - First Part Results' :
                  part === 'R1S' ? 'Round 1 - Second Part Results' :
                  part === 'R2F' ? 'Round 2 - Final Part Results' : '';

    return { title, results };
}

export async function SecondLevel(resultGroupDoc, part) {
    const event = await getSelectedEvent();
    const entries = await getEntriesByEventAndCategory(event?._id, resultGroupDoc.category);

    if (part === 'R1') {
        let combinedResults = [];
        const firstPromise = FirstLevel(resultGroupDoc, 'R1F');
        const secondPromise = FirstLevel(resultGroupDoc, 'R1S');

        let firstMultipler = resultGroupDoc.calcTemplate.round1FirstP / 100;
        let secondMultipler = resultGroupDoc.calcTemplate.round1SecondP / 100;

        if (firstMultipler === 0) {
            const first = await FirstLevel(resultGroupDoc, 'R1S');
            first.results.forEach(element => {
                element.secondTotalScore = element.TotalScore;
            });
            return {
                title: 'Round 2 - Final Results',
                sizeOfpointDetails: 2,
                results: first.results
            };
        } else if (secondMultipler === 0) {
            const first = await FirstLevel(resultGroupDoc, 'R1F');
            first.results.forEach(element => {
                element.firstTotalScore = element.TotalScore;
            });
            return {
                title: 'Round 2 - Final Results',
                sizeOfpointDetails: 2,
                results: first.results
            };
        }

        const allMultipler = firstMultipler + secondMultipler;
        firstMultipler = firstMultipler / allMultipler;
        secondMultipler = secondMultipler / allMultipler;

        const firstResults = (await firstPromise).results;
        const secondResults = (await secondPromise).results;

        for (const entry of entries) {
            const firstResult = firstResults.find(r => r.entry._id.toString() === entry._id.toString());
            const secondResult = secondResults.find(r => r.entry._id.toString() === entry._id.toString());

            if (!firstResult || !secondResult) {
                continue;
            }

            const entryData = await getEntryWithPopulation(entry._id);
            const combinedresult = {
                entry: entryData,
                firstTotalScore: firstResult.TotalScore,
                secondTotalScore: secondResult.TotalScore,
                TotalScore: ((firstResult.TotalScore * firstMultipler) + (secondResult.TotalScore * secondMultipler)),
            };
            combinedResults.push(combinedresult);
        }

        combinedResults.sort((a, b) => b.TotalScore - a.TotalScore);
        return {
            title: 'Round 1 - Final Results',
            results: combinedResults
        };
    } else if (part === 'R2') {
        const first = await FirstLevel(resultGroupDoc, 'R2F');
        first.results.forEach(element => {
            element.firstTotalScore = element.TotalScore;
        });

        return {
            title: 'Round 2 - Final Results',
            sizeOfpointDetails: 2,
            results: first.results
        };
    }

    throw new Error('Invalid part for SecondLevel calculation');
}

export async function TotalLevel(resultGroupDoc) {
    const event = await getSelectedEvent();
    const entries = await getEntriesByEventAndCategory(event?._id, resultGroupDoc.category);
    let combinedResults = [];
    const round1 = await SecondLevel(resultGroupDoc, 'R1');
    const round2 = await SecondLevel(resultGroupDoc, 'R2');

    let round1FirstMultipler = resultGroupDoc.calcTemplate.round1FirstP / 100;
    let round1SecondMultipler = resultGroupDoc.calcTemplate.round1SecondP / 100;
    let round1Multipler = round1FirstMultipler + round1SecondMultipler;
    let round2Multipler = resultGroupDoc.calcTemplate.round2FirstP / 100;

    if (round1Multipler === 0) {
        round2.results.forEach(element => {
            element.round2TotalScore = element.TotalScore;
        });
        return { results: round2.results };
    } else if (round2Multipler === 0) {
        round1.results.forEach(element => {
            element.round1TotalScore = element.TotalScore;
        });
        return { results: round1.results };
    }

    const round1Results = round1.results;
    const round2Results = round2.results;

    for (const entry of entries) {
        const round1Result = round1Results.find(r => r.entry._id.toString() === entry._id.toString());
        const round2Result = round2Results.find(r => r.entry._id.toString() === entry._id.toString());

        if (!round1Result || !round2Result) {
            continue;
        }

        const entryData = await getEntryWithPopulation(entry._id);
        const combinedresult = {
            entry: entryData,
            round1TotalScore: round1Result.TotalScore,
            round2TotalScore: round2Result.TotalScore,
            TotalScore: ((round1Result.TotalScore * round1Multipler) + (round2Result.TotalScore * round2Multipler)),
        };
        combinedResults.push(combinedresult);
    }

    combinedResults.sort((a, b) => b.TotalScore - a.TotalScore);
    return { results: combinedResults };
}
