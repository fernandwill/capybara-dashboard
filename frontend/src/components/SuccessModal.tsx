"use client";

import StatusModal, { StatusModalProps } from "./StatusModal";

type SuccessModalProps = Omit<StatusModalProps, "variant">;

export default function SuccessModal(props: SuccessModalProps) {
  return <StatusModal variant="success" {...props} />;
}
