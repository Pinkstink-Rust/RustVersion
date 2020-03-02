FROM cm2network/steamcmd:root

RUN ls /usr/bin

RUN apt update \
    && apt install -y curl \
    && apt install -y nodejs -y npm \
    && mkdir /node_modules \
    && npm install --prefix / vdf \
    && npm install --prefix / express

USER steam
WORKDIR /home/steam/steamcmd
VOLUME /home/steam/steamcmd

COPY ./src/index.js /index.js
CMD ["node", "/index.js"]
