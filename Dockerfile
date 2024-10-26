FROM node:22

WORKDIR /tmp
RUN wget https://downloadarchive.documentfoundation.org/libreoffice/old/7.5.1.1/deb/x86_64/LibreOffice_7.5.1.1_Linux_x86-64_deb.tar.gz -O libo.tar.gz
RUN apt update \
  && apt install -y libxinerama1 libfontconfig1 libdbus-glib-1-2 libcairo2 libcups2 libglu1-mesa libsm6 libnss3 unzip \
  && ln -s /usr/lib/x86_64-linux-gnu/libssl.so /usr/lib/libssl3.so \
  && tar -zxvf libo.tar.gz
WORKDIR /tmp/LibreOffice_7.5.1.1_Linux_x86-64_deb/DEBS/
RUN dpkg -i *.deb

RUN mkdir /tmp-reports
COPY . /carbone-api
WORKDIR /carbone-api
RUN yarn
CMD node index