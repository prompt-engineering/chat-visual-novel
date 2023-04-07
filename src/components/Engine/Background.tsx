"use client";

import { KV, Location, Scene } from "@/utils/types";
import { RefObject } from "react";
import Image from "next/image";

export type BackgroundProps = {
  scene: Scene;
  locationMap: KV<string>;
  places: KV<Location>;
  bgmMap: KV<string | undefined>;
  bgmRef: RefObject<HTMLAudioElement>;
  onLoaded?: () => {};
};

export function Background(props: BackgroundProps) {
  return (
    <>
      <Image
        src={
          props.scene &&
          props.scene.location &&
          props.scene.location.toLowerCase() in props.locationMap
            ? props.locationMap[props.scene.location.toLowerCase()]
            : props.places[Object.keys(props.places)[0]].image
        }
        alt={props.scene.location ?? ""}
        style={{
          position: "absolute",
          left: "0",
          bottom: "0",
          minHeight: "100%",
          minWidth: "100%",
          objectFit: "cover",
          zIndex: "-2",
        }}
        fill
      />
      <audio
        loop
        src={
          props.scene &&
          props.scene.location &&
          props.scene.location.toLowerCase() in props.bgmMap
            ? props.bgmMap[props.scene.location.toLowerCase()]
            : props.places[Object.keys(props.places)[0]].bgm
        }
        ref={props.bgmRef}
      />
    </>
  );
}
