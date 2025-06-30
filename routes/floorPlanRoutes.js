const express = require("express");
const router = express.Router();
const floorPlanController = require("../controllers/floorPlanController");
const { authenticateToken } = require("../middlewares/authMiddleware");
// GET detail konsol saat di-tap
router.get(
  "/console/:id_ps",
  authenticateToken,
  floorPlanController.getConsoleDetail
);
// PATCH ubah status ps
router.patch(
  "/console/:id_ps/status",
  authenticateToken,
  floorPlanController.updateConsoleStatus
);
router.get(
  "/branch/:id_cabang",
  authenticateToken,
  floorPlanController.getConsolesByBranch
);

router.get(
  "/branch/:id_cabang/consoles",
  floorPlanController.getConsolesByBranch
);
router.get("/floor-plan/:id_cabang", floorPlanController.getFloorPlanByBranch);

module.exports = router;
