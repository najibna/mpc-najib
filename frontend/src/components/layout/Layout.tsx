import type { ReactNode } from "react";
import { FOOTER } from "../../copy";
import AskAiFab from "./AskAiFab";
import Navbar from "./Navbar";

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <div className="app-bg flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="intact-footer mt-auto">
        <p className="intact-footer-title">Intact Receipt Manager</p>
        <p className="intact-footer-text">{FOOTER}</p>
      </footer>
      <AskAiFab />
    </div>
  );
}
