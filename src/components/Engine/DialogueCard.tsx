"use client";

import { Scene } from "@/utils/types";
import { Box, Text } from "@chakra-ui/react";
import Image from "next/image";
import { BeatLoader } from "react-spinners";
import VolumeIcon from "@/assets/icons/volume.svg?url";
import { createRef } from "react";
import { upperFirst } from "lodash-es";

export type DialogueCardProps = {
  scene: Scene;
  voice?: string;
  isVoiceLoading: boolean;
};

export function DialogueCard(props: DialogueCardProps) {
  const voiceRef = createRef<HTMLAudioElement>();

  return (
    <>
      {props.scene.speaker && (
        <Box
          style={{
            borderRadius: "10px 10px 0 0",
            background: "rgba(0,128,128,0.8)",
            color: "white",
            fontSize: "1.2rem",
            fontWeight: "bold",
            textAlign: "center",
            padding: "0.4rem 1rem 0 1rem",
            height: "2.4rem",
            position: "absolute",
            left: "1rem",
            top: "-2.4rem",
          }}
        >
          {upperFirst(props.scene.speaker)}
        </Box>
      )}
      {props.scene.dialogue}
      {props.voice && !props.isVoiceLoading && (
        <Text
          style={{
            position: "relative",
            padding: "0 1rem",
            marginLeft: "0.5rem",
            cursor: "pointer",
            display: "inline",
            filter: "invert(100%)",
          }}
        >
          <Image
            src={VolumeIcon}
            alt={props.scene.speaker}
            fill
            onClick={() => {
              voiceRef.current?.play();
            }}
          />
        </Text>
      )}
      {props.isVoiceLoading && (
        <BeatLoader
          style={{
            display: "inline",
            marginLeft: "0.5rem",
            filter: "invert(100%)",
          }}
        />
      )}
      {props.voice && <audio autoPlay src={props.voice} ref={voiceRef} />}
    </>
  );
}
