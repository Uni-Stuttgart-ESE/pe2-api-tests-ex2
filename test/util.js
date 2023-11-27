import axios from "axios";
import { faker } from "@faker-js/faker";

const apiBasePath = "http://localhost:8080/api/v1";

export default {
    apiBasePath: apiBasePath,
    generateEmail: (firstName, lastName, domain) =>
        faker.internet.email(firstName, lastName, domain),
    generateAssignee: () => {
        const prename = faker.name.firstName();
        const name = faker.name.lastName();
        return {
            prename: prename,
            name: name,
            email: faker.internet.email(prename, name, "iste.uni-stuttgart.de"),
        };
    },
    generateTodo: (assigneeIds = [], dueDate = faker.date.soon().getTime()) => {
        return {
            title: "Create " + faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            assigneeIdList: assigneeIds,
            dueDate: dueDate,
        };
    },
    generateTodoDescription: () => faker.commerce.productDescription(),
    deleteAllAssignees: async () => {
        const assigneeIds = (
            await axios.get(`${apiBasePath}/assignees`)
        ).data.map((a) => a.id);
        assigneeIds.forEach(async (id) => {
            await axios.delete(`${apiBasePath}/assignees/${id}`);
        });
    },
    deleteAllTodos: async () => {
        const todoIds = (await axios.get(`${apiBasePath}/todos`)).data.map(
            (t) => t.id
        );
        todoIds.forEach(async (id) => {
            await axios.delete(`${apiBasePath}/todos/${id}`);
        });
    },
};
