"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function () { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function (v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var csv_parse_1 = require("csv-parse");
function convertTabDelimitedToJson(inputPath, outputPath) {
    return __awaiter(this, void 0, void 0, function () {
        var parser, results, _a, parser_1, parser_1_1, row, entry, e_1_1;
        var _b, e_1, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    parser = fs.createReadStream(inputPath).pipe((0, csv_parse_1.parse)({
                        delimiter: "\t",
                        columns: true, // Treat first row as column names
                        trim: true, // Trim whitespace
                        skipEmptyLines: true,
                    }));
                    results = [];
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 6, 7, 12]);
                    _a = true, parser_1 = __asyncValues(parser);
                    _e.label = 2;
                case 2: return [4 /*yield*/, parser_1.next()];
                case 3:
                    if (!(parser_1_1 = _e.sent(), _b = parser_1_1.done, !_b)) return [3 /*break*/, 5];
                    _d = parser_1_1.value;
                    _a = false;
                    row = _d;
                    entry = {
                        prc_first_name: row["prc_first_name"] || "",
                        prc_middle_name: row["prc_middle_name"] || "",
                        prc_last_name: row["prc_last_name"] || "",
                        prc_suffix: row["prc_suffix"] || "",
                        lic_profession: row["lic_profession"] || "",
                        lic_number: row["lic_number"] || "",
                        lst_description: row["lst_description"] || "",
                        les_description: row["les_description"] || "",
                        prc_dba_name: row["prc_dba_name"] || "",
                        lic_orig_issue_date: row["lic_orig_issue_date"] || "",
                        lic_exp_date: row["lic_exp_date"] || "",
                        prc_entity_name: row["prc_entity_name"] || "",
                    };
                    results.push(entry);
                    _e.label = 4;
                case 4:
                    _a = true;
                    return [3 /*break*/, 2];
                case 5: return [3 /*break*/, 12];
                case 6:
                    e_1_1 = _e.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 12];
                case 7:
                    _e.trys.push([7, , 10, 11]);
                    if (!(!_a && !_b && (_c = parser_1.return))) return [3 /*break*/, 9];
                    return [4 /*yield*/, _c.call(parser_1)];
                case 8:
                    _e.sent();
                    _e.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 11: return [7 /*endfinally*/];
                case 12:
                    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");
                    console.log("Done! Wrote ".concat(results.length, " records to ").concat(outputPath));
                    return [2 /*return*/];
            }
        });
    });
}
// Example usage
convertTabDelimitedToJson(
    'e:\\GitHub\\ClearView\\ClearView\\app\\api\\verify\\missouri\\VET.TXT',
    'e:\\GitHub\\ClearView\\ClearView\\app\\api\\verify\\missouri\\VET.json'
);
