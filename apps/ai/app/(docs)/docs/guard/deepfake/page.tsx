import { DocShell, H2, P, Code, List } from "@/components/docs/DocShell";

export const metadata = { title: "Deepfake detection — Xobriq Docs" };

export default function Page() {
  return (
    <DocShell section="Guard" title="Deepfake detection" intro="Video, audio, and image liveness against GAN attacks." prev={{ href: "/docs/guard/score", label: "Fraud detection API" }} next={{ href: "/docs/guard/identity", label: "Identity verification" }}>
      <H2>Supported media</H2>
      <List items={[
        "Video (mp4, webm) — face swap, deep video puppetry, injection attacks.",
        "Audio (wav, mp3) — cloned voice, TTS impersonation.",
        "Image (jpg, png) — synthetic media, GAN-generated portraits.",
      ]} />
      <H2>Endpoint</H2>
      <Code>POST https://api.xobriq.com/v1/guard/deepfake</Code>
      <H2>Sample request</H2>
      <Code lang="bash">{"`curl -X POST https://api.xobriq.com/v1/guard/deepfake \\\n  -H \"Authorization: Bearer $XOBRIQ_KEY\" \\\n  -F \"media=@selfie.mp4\" \\\n  -F \"session_id=onboarding_9182\"`"}</Code>
      <H2>Response</H2>
      <Code lang="json">{"`{\n  \"authentic\": true,\n  \"confidence\": 0.994,\n  \"liveness\": \"passive+active\",\n  \"manipulations\": []\n}`"}</Code>
    </DocShell>
  );
}