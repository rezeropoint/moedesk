/**
 * YouTube 多频道选择页面
 * /settings/accounts/select-channel
 *
 * 当用户的 Google 账户关联多个 YouTube 频道时显示此页面
 */

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { decryptTempData } from "@/lib/crypto"
import { ChannelSelector } from "@/components/settings/accounts/channel-selector"
import type { GoogleUserInfo, YouTubeChannel } from "@/lib/youtube"

interface TempAuthData {
  tokens: {
    access_token: string
    refresh_token?: string
    expires_in: number
  }
  userinfo: GoogleUserInfo
  channels: YouTubeChannel[]
}

export default async function SelectChannelPage() {
  const cookieStore = await cookies()
  const tempDataCookie = cookieStore.get("youtube_temp_auth")?.value

  // 没有临时数据，重定向回账号管理页面
  if (!tempDataCookie) {
    redirect("/settings/accounts?error=session_expired")
  }

  // 解密临时数据
  const tempData = decryptTempData<TempAuthData>(tempDataCookie)
  if (!tempData) {
    redirect("/settings/accounts?error=session_expired")
  }

  const { userinfo, channels } = tempData

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">选择 YouTube 频道</h1>
        <p className="text-muted-foreground">
          您的 Google 账户 ({userinfo.email}) 关联了多个 YouTube 频道，
          请选择要绑定的频道。可以选择多个频道。
        </p>
      </div>

      <ChannelSelector
        channels={channels}
        userEmail={userinfo.email}
      />
    </div>
  )
}
