package main

import (
	caddycmd "github.com/caddyserver/caddy/v2/cmd"

	// plug in Caddy modules here
	_ "github.com/caddyserver/caddy/v2/modules/standard"
	_ "github.com/inverse-inc/packetfence/go/plugin/caddy2/api-aaa"
	_ "github.com/inverse-inc/packetfence/go/plugin/caddy2/api"
)

func main() {
	caddycmd.Main()
}
