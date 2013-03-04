var DEFAULT_ELO = 1000;
var ELO_DIVIDE_FACTOR = 400.0;
var ELO_PUSILLANIMITY = 10; // Less value => more aggressive points variance.

function calculateElo(winner, loser, points_diff) {
    var adjustedResultDiff = calculateResultDiff(winner, loser) * (humiliationWeight(points_diff) / 10);
    var elodiff = Math.round(adjustedResultDiff * DEFAULT_ELO/ELO_PUSILLANIMITY);
    return elodiff;
}

function calculateElo(winner, loser) {
    var resultDiff = calculateResultDiff(winner, loser);
    var elodiff = Math.round(resultDiff * DEFAULT_ELO/ELO_PUSILLANIMITY);
    return elodiff;
}

function calculateResultDiff(winner, loser){
    var downFactor = (1 + Math.pow(10, (loser - winner) / ELO_DIVIDE_FACTOR));
    var expectedResult = 1 / downFactor;
    var result = 1 - expectedResult;
    return result;
}

function humiliationWeight(points_diff) {
    if (points_diff > 2 && points_diff < 6) {
        return 12;
    } else if (points_diff >= 6 && points_diff < 9) {
        return 14;
    } else if (points_diff <= 2) {
        return 9;
    } else {
        return 16;
    }
}



