export const RunStatus=async(eventId:string)=>{
  const response = await fetch(process.env.NEXT_PUBLIC_INNGEST_SERVER_URL+`/${eventId}/runs`, {
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_INNGEST_SIGINING_KEY}`,
    },
  });
  const json = await response.json();
  return json.data;
}