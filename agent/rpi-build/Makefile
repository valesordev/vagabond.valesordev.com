# agent/rpi-build/Makefile
# Targets:
#   make build          — build vagabond-pi.img (requires .env.builder)
#   make flash DISK=    — flash the image to a disk (e.g. make flash DISK=/dev/sdb)
#   make clean          — remove build artifacts

.PHONY: build flash clean

OUT_DIR := $(CURDIR)/out
IMAGE   := $(OUT_DIR)/vagabond-pi.img

-include .env.builder

build: $(OUT_DIR)
	docker build \
		--progress=plain \
		--build-arg VAGABOND_SSH_PUBKEY="$(shell cat $(SSH_PUBKEY_PATH))" \
		--build-arg POSTGRES_PASSWORD="$(POSTGRES_PASSWORD)" \
		--build-arg VAGABOND_DEV_USER_ID="$(VAGABOND_DEV_USER_ID)" \
		--build-arg VAGABOND_DEV_USER_EMAIL="$(VAGABOND_DEV_USER_EMAIL)" \
		--build-arg VAGABOND_DEV_USER_DISPLAY_NAME="$(VAGABOND_DEV_USER_DISPLAY_NAME)" \
		--build-arg JWT_SECRET="$(JWT_SECRET)" \
		--build-arg NEXTAUTH_SECRET="$(NEXTAUTH_SECRET)" \
		--build-arg VAGABOND_WIFI_SSID="$(VAGABOND_WIFI_SSID)" \
		--build-arg VAGABOND_WIFI_PSK="$(VAGABOND_WIFI_PSK)" \
		--output type=local,dest=$(OUT_DIR) \
		.
	@echo "Image built: $(IMAGE)"
	@ls -lh $(IMAGE)

flash:
ifndef DISK
	$(error DISK is required. Example: make flash DISK=/dev/sdb)
endif
	@echo "Flashing $(IMAGE) → $(DISK)"
	@echo "WARNING: this will erase $(DISK). Press Ctrl-C to abort, Enter to continue."
	@read _confirm
	dd if=$(IMAGE) of=$(DISK) bs=4M status=progress conv=fsync
	sync
	@echo "Flash complete. Eject and insert into Pi."

clean:
	rm -rf $(OUT_DIR)

$(OUT_DIR):
	mkdir -p $(OUT_DIR)
