{
  description = "Quizer development environment and deployable packages";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    devshell.url = "github:numtide/devshell";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
    devshell,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = import nixpkgs {
        inherit system;
        overlays = [devshell.overlays.default];
      };
    in {
      devShells.default = pkgs.devshell.mkShell {
        name = "quizer";

        packages = with pkgs; [
          nodejs_22
          pnpm_11
        ];

        env = [
          {
            name = "LD_LIBRARY_PATH";
            value = pkgs.lib.makeLibraryPath (with pkgs; [
              alsa-lib
              at-spi2-core
              cairo
              cups
              dbus
              expat
              glib
              gtk3
              libgbm
              libdrm
              libxkbcommon
              libx11
              libxcb
              libxcomposite
              libxdamage
              libxext
              libxfixes
              libxrandr
              mesa
              nspr
              nss
              pango
            ]);
          }
        ];

        commands = [
          {
            name = "web";
            help = "Run the frontend dev server";
            command = "pnpm dev";
          }
        ];
      };
    });
}
