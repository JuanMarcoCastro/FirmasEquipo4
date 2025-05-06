"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { mockNotifications } from "@/lib/mock-data"

interface NotificationsPopoverProps {
  count: number
}

export function NotificationsPopover({ count }: NotificationsPopoverProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(mockNotifications)

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {count > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
              {count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notificaciones</h3>
          {notifications.some((n) => !n.read) && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Marcar todas como leídas
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent cursor-pointer ${!notification.read ? "bg-accent/30" : ""}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium">
                      {notification.type === "signature_request"
                        ? "Solicitud de Firma"
                        : notification.type === "signature_completed"
                          ? "Firma Completada"
                          : "Documento Subido"}
                    </p>
                    <span className="text-xs text-muted-foreground">{notification.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">No tienes notificaciones</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
