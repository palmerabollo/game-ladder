var DEFAULT_ELO = 1000;
var ELO_DIVIDE_FACTOR = 400.0;
var ELO_PUSILLANIMITY = 10; //Less value more aggressive points variance.

function calculateElo(winner, loser, points) {
    var downFactor = (1 + Math.pow(10, (loser - winner) / ELO_DIVIDE_FACTOR));
    var expectedResult = 1 / downFactor;
    var resultDiff = 1 - expectedResult;
    var adjustedResultDiff = resultDiff * (humiliationWeight(points)/10);
    var elodiff = Math.round(adjustedResultDiff * DEFAULT_ELO/ELO_PUSILLANIMITY);
    return elodiff;
}

function humiliationWeight(points) {
    var difference = points[0] - points[1];

    //The most common case at the top in order to get the result earlier.
    if (difference >2 && difference < 6) {
        return 12;
    } else if (difference >= 6 && difference <9) {
        return 14;
    } else if (difference <= 2) {
        return 9;
    } else {
        return 16;
    }
}



