import { Router } from "express";
import { registerUser ,loginUser, logoutUser } from "../controllers/user.controller.js";
const router = Router();
import { upload } from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

// localhost:9090/api/v1/users/registe
router.route("/register").post( upload.fields([
    {
        name : "avatar",
        maxCount : 1
    },
    {
        name : "coverImage",
        maxCount : 1
    }
]) ,registerUser)

router.route("/login").post(loginUser);

// secure route
router.route("/logout").post(verifyJWT , loginUser)

export default router;
