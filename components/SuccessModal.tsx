import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface SuccessModalProps {
  isOpen: boolean;
  message: string;
  onClose?: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  message,
  onClose,
}) => {
  const navigate = useNavigate();

  const handleClose = () => {
    if (onClose) onClose();
    navigate("/login");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm flex flex-col items-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <motion.div
              className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
            >
              <motion.svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.path d="M5 13l4 4L19 7" />
              </motion.svg>
            </motion.div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2" style={{ fontFamily: "Inter, Nunito, sans-serif" }}>
              Compte créé avec succès 🎉
            </h2>
            <p className="text-gray-600 text-center mb-6">{message}</p>
            <motion.button
              className="w-full py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 shadow hover:from-blue-700 hover:to-violet-700 transition-colors focus:outline-none"
              whileTap={{ scale: 0.95 }}
              onClick={handleClose}
              type="button"
              style={{ fontFamily: "Inter, Nunito, sans-serif" }}
            >
              Fermer
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessModal;
