/*
 * cifrado.c - SHA-256 sin dependencias externas
 */
#include "comunes.h"
#include <stdint.h>

#define ROTR(x,n) (((x)>>(n))|((x)<<(32-(n))))
#define CH(x,y,z) (((x)&(y))^(~(x)&(z)))
#define MAJ(x,y,z) (((x)&(y))^((x)&(z))^((y)&(z)))
#define EP0(x) (ROTR(x,2)^ROTR(x,13)^ROTR(x,22))
#define EP1(x) (ROTR(x,6)^ROTR(x,11)^ROTR(x,25))
#define SIG0(x) (ROTR(x,7)^ROTR(x,18)^((x)>>3))
#define SIG1(x) (ROTR(x,17)^ROTR(x,19)^((x)>>10))

static const uint32_t K[64]={
0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2};

typedef struct { uint8_t d[64]; uint32_t dl; uint64_t bl; uint32_t s[8]; } S256;

static void tr(S256*c,const uint8_t d[]){
    uint32_t a,b,cc,dd,e,f,g,h,t1,t2,w[64]; int i;
    for(i=0;i<16;i++) w[i]=((uint32_t)d[i*4]<<24)|((uint32_t)d[i*4+1]<<16)|((uint32_t)d[i*4+2]<<8)|d[i*4+3];
    for(i=16;i<64;i++) w[i]=SIG1(w[i-2])+w[i-7]+SIG0(w[i-15])+w[i-16];
    a=c->s[0];b=c->s[1];cc=c->s[2];dd=c->s[3];e=c->s[4];f=c->s[5];g=c->s[6];h=c->s[7];
    for(i=0;i<64;i++){t1=h+EP1(e)+CH(e,f,g)+K[i]+w[i];t2=EP0(a)+MAJ(a,b,cc);h=g;g=f;f=e;e=dd+t1;dd=cc;cc=b;b=a;a=t1+t2;}
    c->s[0]+=a;c->s[1]+=b;c->s[2]+=cc;c->s[3]+=dd;c->s[4]+=e;c->s[5]+=f;c->s[6]+=g;c->s[7]+=h;
}

void Sha256String(const char *entrada, char *salida) {
    S256 c; uint8_t hash[32]; uint32_t i; size_t len=strlen(entrada);
    c.dl=0;c.bl=0;c.s[0]=0x6a09e667;c.s[1]=0xbb67ae85;c.s[2]=0x3c6ef372;c.s[3]=0xa54ff53a;
    c.s[4]=0x510e527f;c.s[5]=0x9b05688c;c.s[6]=0x1f83d9ab;c.s[7]=0x5be0cd19;
    for(i=0;i<len;i++){c.d[c.dl]=entrada[i];c.dl++;if(c.dl==64){tr(&c,c.d);c.bl+=512;c.dl=0;}}
    i=c.dl;c.d[i++]=0x80;
    if(c.dl<56){while(i<56)c.d[i++]=0;}else{while(i<64)c.d[i++]=0;tr(&c,c.d);memset(c.d,0,56);}
    c.bl+=c.dl*8;
    c.d[63]=(uint8_t)(c.bl);c.d[62]=(uint8_t)(c.bl>>8);c.d[61]=(uint8_t)(c.bl>>16);c.d[60]=(uint8_t)(c.bl>>24);
    c.d[59]=(uint8_t)(c.bl>>32);c.d[58]=(uint8_t)(c.bl>>40);c.d[57]=(uint8_t)(c.bl>>48);c.d[56]=(uint8_t)(c.bl>>56);
    tr(&c,c.d);
    for(i=0;i<4;i++){hash[i]=(c.s[0]>>(24-i*8))&0xff;hash[i+4]=(c.s[1]>>(24-i*8))&0xff;
    hash[i+8]=(c.s[2]>>(24-i*8))&0xff;hash[i+12]=(c.s[3]>>(24-i*8))&0xff;
    hash[i+16]=(c.s[4]>>(24-i*8))&0xff;hash[i+20]=(c.s[5]>>(24-i*8))&0xff;
    hash[i+24]=(c.s[6]>>(24-i*8))&0xff;hash[i+28]=(c.s[7]>>(24-i*8))&0xff;}
    for(i=0;i<32;i++) sprintf(salida+(i*2),"%02x",hash[i]);
    salida[64]='\0';
}
