import { exportUserData } from "../controllers/exportController.js";

export default (api) => {
    api.post('/exportUserData', exportUserData);

    return api;
};