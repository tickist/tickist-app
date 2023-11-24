import { isOverdue } from "./task-utils";
import { Task } from "@data/tasks/models/tasks";
import { addDays } from "date-fns";

describe("#isOverdue", () => {
    it("should return true because task is overdue", () => {
        const task = <Partial<Task>>{
            name: "task",
            finishDate: addDays(new Date(), -1),
        };
        expect(isOverdue(task as Task)).toBeTruthy();
    });

    it("should return false because task is not overdue", () => {
        const task = <Partial<Task>>{
            name: "task",
            finishDate: addDays(new Date(), 1),
        };
        expect(isOverdue(task as Task)).toBeFalsy();
    });

    it("should return false because task is not overdue and finishDate is set to today", () => {
        const finishDate = new Date();
        finishDate.setHours(23, 58, 0, 0);
        const task = <Partial<Task>>{
            name: "task",
            finishDate: finishDate,
        };
        expect(isOverdue(task as Task)).toBeFalsy();
    });

    it("should return false because task is not overdue and finishDate is set to today", () => {
        const finishDate = new Date();
        finishDate.setHours(1, 1, 0, 0);
        const task = <Partial<Task>>{
            name: "task",
            finishDate: finishDate,
        };
        expect(isOverdue(task as Task)).toBeFalsy();
    });
});
