# agent/rpi-build/Dockerfile
# Produces a flashable Raspberry Pi OS Lite (arm64) image with Docker,
# Docker Compose, and the Vagabond edge stack pre-installed.
#
# Build: docker build -t vagabond-pi-builder .
# Run:   docker run --privileged -v $(pwd)/out:/out vagabond-pi-builder
#
# Requires --privileged for loopback mount and binfmt_misc (QEMU arm64 chroot).

FROM debian:bookworm-slim

# Tools for image manipulation and arm64 chroot
RUN apt-get update && apt-get install -y --no-install-recommends \
        wget curl xz-utils zip \
        kpartx parted dosfstools \
        qemu-user-static binfmt-support \
        ca-certificates git \
    && rm -rf /var/lib/apt/lists/*

ARG RPI_OS_URL=https://downloads.raspberrypi.com/raspios_lite_arm64/images/raspios_lite_arm64-2024-11-19/2024-11-19-raspios-bookworm-arm64-lite.img.xz
ARG RPI_OS_SHA256=91571f9a4cf0d77fa4b5d4c8a8e5b24e4e67c1c9c5e6f2b8c3d1a4f5e9b7c2d1

ARG VAGABOND_SSH_PUBKEY
ARG POSTGRES_PASSWORD
ARG VAGABOND_DEV_USER_ID
ARG VAGABOND_DEV_USER_EMAIL=brian@vagabond.local
ARG VAGABOND_DEV_USER_DISPLAY_NAME=Brian
ARG JWT_SECRET
ARG NEXTAUTH_SECRET
ARG VAGABOND_WIFI_SSID
ARG VAGABOND_WIFI_PSK

WORKDIR /build

# Download and extract base image
RUN wget -q -O rpi-os.img.xz "${RPI_OS_URL}" \
    && xz -d rpi-os.img.xz \
    && mv rpi-os.img vagabond-base.img

COPY config/ /build/config/

# Inject customizations into the image via loopback mount + chroot
RUN --mount=type=bind,source=config,target=/build/config \
    bash /build/config/customize-image.sh vagabond-base.img

# Output the final image
RUN cp vagabond-base.img /out/vagabond-pi.img

CMD ["bash", "-c", "echo 'Image built at /out/vagabond-pi.img'"]
