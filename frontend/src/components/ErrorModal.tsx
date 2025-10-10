"use client";

import StatusModal, { StatusModalProps } from "./StatusModal";

type ErrorModalProps = Omit<StatusModalProps, "variant">;

export default function ErrorModal(props: ErrorModalProps) {
  return <StatusModal variant="error" {...props} />;
}
