import pyotp
from pyotp import TOTP
import qrcode
from PIL import Image

def genera_uri(secret_key, email,issuer):
    uri=pyotp.totp.TOTP(secret_key).provisioning_uri(name=email, issuer_name=issuer)
    return uri
def genera_qr(secret_key,uri):
    #resp=input("Ya habilitaste tu QR? no :1, 2:si ")
    qr=qrcode.make(uri).save("qr.png")
    totpq = pyotp.TOTP(secret_key)
    img=Image.open(rf"qr.png")
    img.show()
    return totpq

def verifica_otp(totp_qr):
    otp=input("Inserta tu codigo ")
    print(totp_qr.verify(int(otp)))



class User:
  def __init__(self, user, password):
    self.user = user
    self.password = password
    self.key=pyotp.random_base32()
    self.ur=genera_uri(self.key, self.user, "Casa Monarca")
    self.tot=genera_qr(self.key,self.ur)
    

u1 = User("Buddy", "111")
u2 = User("Max", "222")
u3 = User("Charlie", "333")

user_list=[u1,u2,u3]

def login_inicial():
    persona=input("Ingresa tu username ")
    password=input("Ingresa tu password ")
    for i in user_list:
       if persona==i.user and password==i.password:
            otp=input("Ingresa tu OTP: ")
            print(i.tot.verify(otp))
          
#login_inicial()


def login():
    persona=input("Ingresa tu username ")
    password=input("Ingresa tu password ")
    for i in user_list:
       if persona==i.user and password==i.password:
            print("entraste correctamente")
            otp=input("Ingresa tu OTP: ")
            print(i.tot.verify(int(otp)))

login()
login()
login()
          
