import { AccessToken, RoomServiceClient, EgressClient, EncodedFileOutput } from 'livekit-server-sdk';
import { config } from '../config';

export async function createLiveKitToken({
  roomName,
  participantIdentity,
  participantName,
  isTeacher = false,
}: {
  roomName: string;
  participantIdentity: string;
  participantName: string;
  isTeacher?: boolean;
}): Promise<string> {
  const at = new AccessToken(config.LIVEKIT_API_KEY, config.LIVEKIT_API_SECRET, {
    identity: participantIdentity,
    name: participantName,
    ttl: '2h',
  });

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: isTeacher, // Teacher can publish by default; students can publish if allowed
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isTeacher,
  });

  return await at.toJwt();
}

export function getRoomServiceClient(): RoomServiceClient {
  const httpUrl = config.LIVEKIT_URL.replace('wss://', 'https://').replace('ws://', 'http://');
  return new RoomServiceClient(httpUrl, config.LIVEKIT_API_KEY, config.LIVEKIT_API_SECRET);
}

export function getEgressClient(): EgressClient {
  const httpUrl = config.LIVEKIT_URL.replace('wss://', 'https://').replace('ws://', 'http://');
  return new EgressClient(httpUrl, config.LIVEKIT_API_KEY, config.LIVEKIT_API_SECRET);
}

export async function startClassRecording(roomName: string, courseId: string, classId: string): Promise<string | null> {
  try {
    const egressClient = getEgressClient();
    const fileOutput = new EncodedFileOutput({
      filepath: `recordings/${courseId}/${classId}.mp4`,
      output: {
        case: 's3',
        value: {
          accessKey: config.R2_ACCESS_KEY_ID,
          secret: config.R2_SECRET_ACCESS_KEY,
          bucket: config.R2_BUCKET_PRIVATE,
          endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          region: 'auto',
          forcePathStyle: true,
        },
      },
    });

    const info = await egressClient.startRoomCompositeEgress(roomName, {
      file: fileOutput,
    });
    return info.egressId;
  } catch (error) {
    console.warn('LiveKit Egress could not start (recording may not be configured in local dev):', error);
    return null;
  }
}
