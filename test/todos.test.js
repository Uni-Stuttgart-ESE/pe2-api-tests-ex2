import axios from "axios";
import util from "./util";

describe("Todos: API resources", () => {
    // shared variables to check for later on
    let assigneeIds;
    let sharedTodo;
    let sharedId;

    beforeAll(async () => {
        // delete all existing todos
        await util.deleteAllTodos();
        // delete all existing assignees
        await util.deleteAllAssignees();
        // create new assignees to use in todos
        for (let x = 0; x < 3; x++) {
            await axios.post(
                `${util.apiBasePath}/assignees`,
                util.generateAssignee()
            );
        }
        // retrieve created assignee IDs
        assigneeIds = (
            await axios.get(`${util.apiBasePath}/assignees`)
        ).data.map((a) => a.id);

        // generate random todo
        sharedTodo = util.generateTodo(assigneeIds);
    });

    test("create a valid todo (201, id returned)", async () => {
        const res = await axios.post(`${util.apiBasePath}/todos`, sharedTodo);
        expect(res.status).toBe(201);
        // id is returned (number) and >= 0
        expect(Number.isInteger(res.data.id)).toBe(true);
        expect(res.data.id).toBeGreaterThanOrEqual(0);
    });

    test("retrieve all todos (check for the newly created one)", async () => {
        const list = (await axios.get(`${util.apiBasePath}/todos`)).data;
        // response is an array
        expect(Array.isArray(list)).toBe(true);
        // check for length 1
        expect(list.length).toBe(1);
        // check for simple attributes
        expect(list[0].title).toBe(sharedTodo.title);
        expect(list[0].description).toBe(sharedTodo.description);
        expect(list[0].finished).toBe(false);
        expect(list[0].dueDate).toBe(sharedTodo.dueDate);
        // check assigneeList entries
        expect(Array.isArray(list[0].assigneeList)).toBe(true);
        expect(list[0].assigneeList.length).toBe(assigneeIds.length);
        list[0].assigneeList.forEach((assignee) => {
            expect(assigneeIds).toContain(assignee.id);
            expect(typeof assignee.prename).toBe("string");
            expect(assignee.prename.length).toBeGreaterThanOrEqual(1);
            expect(typeof assignee.name).toBe("string");
            expect(assignee.name.length).toBeGreaterThanOrEqual(1);
            expect(typeof assignee.email).toBe("string");
            expect(assignee.email.endsWith("uni-stuttgart.de")).toBe(true);
        });
        // check if created date is not older than several seconds
        expect(new Date().getTime() - list[0].createdDate).toBeLessThan(30000);

        // save ID for later comparisons
        sharedId = list[0].id || 0;
    });

    test("retrieve the created todo (check for attributes)", async () => {
        const todo = (await axios.get(`${util.apiBasePath}/todos/${sharedId}`))
            .data;
        // check for simple attributes
        expect(todo.title).toBe(sharedTodo.title);
        expect(todo.description).toBe(sharedTodo.description);
        expect(todo.finished).toBe(false);
        expect(todo.dueDate).toBe(sharedTodo.dueDate);
        // check assigneeList entries
        expect(Array.isArray(todo.assigneeList)).toBe(true);
        expect(todo.assigneeList.length).toBe(assigneeIds.length);
        todo.assigneeList.forEach((assignee) => {
            expect(assigneeIds).toContain(assignee.id);
            expect(typeof assignee.prename).toBe("string");
            expect(assignee.prename.length).toBeGreaterThanOrEqual(1);
            expect(typeof assignee.name).toBe("string");
            expect(assignee.name.length).toBeGreaterThanOrEqual(1);
            expect(typeof assignee.email).toBe("string");
            expect(assignee.email.endsWith("uni-stuttgart.de")).toBe(true);
        });
        // check if created date is not older than several seconds
        expect(new Date().getTime() - todo.createdDate).toBeLessThan(30000);
    });

    test("delete an assignee (200) and check if the todo is updated", async () => {
        const res1 = await axios.delete(
            `${util.apiBasePath}/assignees/${assigneeIds[0]}`
        );
        expect(res1.status).toBe(200);
        const res2 = await axios.get(`${util.apiBasePath}/todos/${sharedId}`);
        expect(res2.data.assigneeList.includes(assigneeIds[0])).toBe(false);
    });

    test("edit the created todo (200) and retrieve it with the change", async () => {
        sharedTodo.description = util.generateTodoDescription();
        sharedTodo.assigneeIdList = [];
        sharedTodo.finished = true;

        const res = await axios.put(
            `${util.apiBasePath}/todos/${sharedId}`,
            sharedTodo
        );
        expect(res.status).toBe(200);
        // retrieve and validate updated entity
        const updated = (
            await axios.get(`${util.apiBasePath}/todos/${sharedId}`)
        ).data;
        // check changes of simple attributes
        expect(updated.description).toBe(sharedTodo.description);
        expect(updated.assigneeList.map((a) => a.id)).toEqual(
            sharedTodo.assigneeIdList
        );
        expect(updated.finished).toBe(true);
        // check if finished date is not older than several seconds
        expect(new Date().getTime() - updated.finishedDate).toBeLessThan(20000);
    });

    test("validation: todo with empty title fails (400)", async () => {
        sharedTodo.title = "";
        await expect(
            axios.post(`${util.apiBasePath}/todos`, sharedTodo)
        ).rejects.toThrow("Request failed with status code 400");
    });

    test("validation: todo with invalid assigneeIds fails (400)", async () => {
        // use a negative assigneeId
        sharedTodo = util.generateTodo([-99]);
        await expect(
            axios.post(`${util.apiBasePath}/todos`, sharedTodo)
        ).rejects.toThrow("Request failed with status code 400");
        // use a very large assigneeId that should not exist
        sharedTodo.assigneeIdList = [Number.MAX_SAFE_INTEGER];
        await expect(
            axios.post(`${util.apiBasePath}/todos`, sharedTodo)
        ).rejects.toThrow("Request failed with status code 400");
    });

    test("validation: todo with 3x the same assigneeId fails (400)", async () => {
        sharedTodo = util.generateTodo([
            assigneeIds[0],
            assigneeIds[0],
            assigneeIds[0],
        ]);
        await expect(
            axios.post(`${util.apiBasePath}/todos`, sharedTodo)
        ).rejects.toThrow("Request failed with status code 400");
    });

    test("validation: todo with invalid dueDate fails (400)", async () => {
        sharedTodo = util.generateTodo([], "01.01.2022");
        await expect(
            axios.post(`${util.apiBasePath}/todos`, sharedTodo)
        ).rejects.toThrow("Request failed with status code 400");
        sharedTodo.dueDate = "YOU SHALL NOT PASS!!!";
        await expect(
            axios.post(`${util.apiBasePath}/todos`, sharedTodo)
        ).rejects.toThrow("Request failed with status code 400");
    });

    test("delete the created todo (200)", async () => {
        const res = await axios.delete(`${util.apiBasePath}/todos/${sharedId}`);
        expect(res.status).toBe(200);
    });

    test("edit for non-existing todo fails (404)", async () => {
        // PUT should fail with 404
        await expect(
            axios.put(
                `${util.apiBasePath}/todos/${sharedId}`,
                util.generateTodo()
            )
        ).rejects.toThrow("Request failed with status code 404");
    });

    test("delete for non-existing todo fails (404)", async () => {
        // DELETE should fail with 404
        await expect(
            axios.delete(`${util.apiBasePath}/todos/${sharedId}`)
        ).rejects.toThrow("Request failed with status code 404");
    });
});
