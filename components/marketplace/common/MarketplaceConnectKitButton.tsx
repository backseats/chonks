import { ConnectKitButton } from "connectkit";

export default function MarketplaceConnectKitButton() {
  return (
    <ConnectKitButton
      // theme="web"
      label="Sign In"
      customTheme={{
        "--ck-font-family": "'Source Code Pro', monospace",
        "--ck-primary-button-background": "#2F7BA7",
        "--ck-primary-button-hover-background": "#FFFFFF",
        "--ck-primary-button-hover-color": "#2F7BA7",
        "--ck-primary-button-border-radius": "0px",
        "--ck-primary-button-font-weight": "600",
        "--ck-connectbutton-background": "#2F7BA7",
        "--ck-connectbutton-hover-background": "#111111",
        "--ck-connectbutton-hover-color": "#FFFFFF",
        "--ck-connectbutton-border-radius": "0px",
        "--ck-connectbutton-color": "#FFFFFF",
        "--ck-connectbutton-font-weight": "600",
        "--ck-connectbutton-font-size": "18px",
      }}
    />
  );
}
