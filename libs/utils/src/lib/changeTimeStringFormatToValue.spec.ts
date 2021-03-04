import {changeTimeStringFormatToValue} from "./changeTimeStringFormatToValue";

describe("Change Time string format to value e.g change 2h 23m to 143", () => {
    it('should return proper value', () => {
        expect(changeTimeStringFormatToValue('2h 44m')).toBe(164)
        expect(changeTimeStringFormatToValue('TEST 2h 43m')).toBe(163)
        expect(changeTimeStringFormatToValue('2h 43m TEST')).toBe(163)
        expect(changeTimeStringFormatToValue('2h     43m')).toBe(163)
        expect(changeTimeStringFormatToValue('2h43m')).toBe(163)

    })
    it('should return proper value (only minutes)', () => {
        expect(changeTimeStringFormatToValue('54m')).toBe(54)
        expect(changeTimeStringFormatToValue('11')).toBe(11)
    })

    it('should return proper value (only hours)', () => {
        expect(changeTimeStringFormatToValue('1h')).toBe(60)
        expect(changeTimeStringFormatToValue('11h')).toBe(11*60)
    })

    it('should return 0 because argument has wrong format', () => {
        expect(changeTimeStringFormatToValue('TEST')).toBe(0)
        expect(changeTimeStringFormatToValue('')).toBe(0)
        expect(changeTimeStringFormatToValue(null)).toBe(0)
        expect(changeTimeStringFormatToValue(undefined)).toBe(0)
    })
} )
