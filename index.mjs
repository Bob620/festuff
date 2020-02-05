import {gaussianFit} from "./processes/peakfit.mjs";
import reverse from "./processes/reverse.mjs";
import {basicIntegration} from "./processes/integrate.mjs";
import {ArrayIter} from "./util/interator.mjs";

const line = new ArrayIter([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
const testLine = line.concat(line);
const reverseLine = reverse(line);
const integratedLine = basicIntegration(line);
const test = reverse(testLine);

const idk2 = test.slice(0, 19);

const uhoh = gaussianFit([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
const gaussedLine = gaussianFit(line);
const reversi = gaussianFit(reverseLine);
const idk = gaussianFit(testLine.slice(19));
const gaussedReverse = gaussianFit(test.slice(19));
const gaussedOne = gaussianFit(test.slice(0, 19));

console.log();