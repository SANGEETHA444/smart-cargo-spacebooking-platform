import { Router } from "express";
import { auth } from "../middleware/auth.js";
import * as authCtrl from "../controllers/authController.js";
import * as adminCtrl from "../controllers/adminController.js";
import * as lspCtrl from "../controllers/lspController.js";
import * as containerCtrl from "../controllers/containerController.js";
import * as bookingCtrl from "../controllers/bookingController.js";
import * as chatCtrl from "../controllers/chatController.js";
import * as paymentCtrl from "../controllers/paymentController.js";

const router = Router();

router.post("/auth/register/trader", authCtrl.registerTrader);
router.post("/auth/lsp/apply", authCtrl.applyLsp);
router.post("/auth/login", authCtrl.login);
router.post("/auth/verify-otp", authCtrl.verifyOtp);

router.get("/admin/lsp-applications", auth(["ADMIN"]), adminCtrl.listLspApplications);
router.post("/admin/lsp/:id/schedule-inspection", auth(["ADMIN"]), adminCtrl.scheduleInspection);
router.post("/admin/lsp/:id/decision", auth(["ADMIN"]), adminCtrl.lspDecision);
router.get("/admin/analytics", auth(["ADMIN"]), adminCtrl.analytics);

router.get("/lsp/me", auth(["LSP"]), lspCtrl.getMyLspProfile);

router.get("/containers", auth(["TRADER", "LSP", "ADMIN"]), containerCtrl.searchContainers);
router.post("/containers", auth(["LSP"]), containerCtrl.createContainer);
router.patch("/containers/:id/space", auth(["LSP"]), containerCtrl.updateSpace);
router.get("/containers/:id/price-suggest", auth(["LSP"]), containerCtrl.priceSuggestion);
router.get("/containers/:id", auth(["TRADER", "LSP", "ADMIN"]), containerCtrl.getContainer);

router.get("/payments/config", auth(["TRADER", "LSP", "ADMIN"]), paymentCtrl.getPaymentConfig);
router.post("/bookings", auth(["TRADER"]), bookingCtrl.createBooking);
router.post("/payments/verify", auth(["TRADER"]), bookingCtrl.verifyPayment);
router.post("/bookings/:id/cancel", auth(["TRADER", "LSP", "ADMIN"]), bookingCtrl.cancelBooking);
router.get("/bookings/mine", auth(["TRADER", "LSP"]), bookingCtrl.myBookings);
router.get("/bookings/:id/invoice", auth(["TRADER", "LSP", "ADMIN"]), bookingCtrl.getInvoice);

router.get("/chats", auth(["TRADER", "LSP"]), chatCtrl.listChats);
router.post("/chats", auth(["TRADER", "LSP"]), chatCtrl.createChat);
router.get("/chats/:id/messages", auth(["TRADER", "LSP"]), chatCtrl.getMessages);

router.get("/health", (_req, res) => res.json({ ok: true }));

export default router;
