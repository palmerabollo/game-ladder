var DEFAULT_ELO = 1000;
var ELO_DIVIDE_FACTOR = 400.0;
var ELO_PUSILLANIMITY = 10; // Less value => more aggressive points variance.

function calculateElo(winner, loser, points_diff) {
    var humiliationWeight = points_diff ? humiliationWeight(points_diff) : 1;
    var adjustedResultDiff = calculateResultDiff(winner, loser) * humiliationWeight;
    var elodiff = Math.round(adjustedResultDiff * DEFAULT_ELO / ELO_PUSILLANIMITY);
    return elodiff;
}

function calculateResultDiff(winner, loser){
    var downFactor = 1 + Math.pow(10, (loser - winner) / ELO_DIVIDE_FACTOR);
    var expectedResult = 1 / downFactor;
    var result = 1 - expectedResult;
    return result;
}

function humiliationWeight(points_diff) {
    var res = 1.6;

    if (points_diff > 2 && points_diff < 6) {
        res = 1.2;
    } else if (points_diff >= 6 && points_diff < 9) {
        res = 1.4;
    } else if (points_diff <= 2) {
        res = 0.9;
    }

    return res;
}