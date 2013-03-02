var DEFAULT_ELO = 1000;
var ELO_DIVIDE_FACTOR = 400.0;
var ELO_PUSILLANIMITY = 10; //Less value more aggressive points variance.

function calculateElo(winner, loser) {
    var downFactor = (1 + Math.pow(10, (loser - winner) / ELO_DIVIDE_FACTOR));
    var expectedResult = 1 / downFactor;
    var resultDiff = 1 - expectedResult;
    var elodiff = Math.round(resultDiff * DEFAULT_ELO/ELO_PUSILLANIMITY);
    return elodiff;
}



