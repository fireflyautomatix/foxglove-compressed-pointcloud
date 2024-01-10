/*
 * Copyright (c) 2024, FireFly Automatix
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *
 *    * Neither the name of the copyright holder nor the names of its
 *      contributors may be used to endorse or promote products derived from
 *      this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

import { ExtensionContext } from "@foxglove/studio";
import { ZSTDDecoder } from "zstddec";

// import { createDecoderModule } from "draco3d";

// Based on https://github.com/google/draco/blob/9f856abaafb4b39f1f013763ff061522e0261c6f/javascript/npm/draco3d/draco_nodejs_example.js
// let decoderModule: any = null;
// let decoder: any = null;

// The code to create the encoder and decoder modules is asynchronous.
// draco3d.createDecoderModule will return a promise to a funciton with a
// module as a parameter when the module has been fully initialized.
// Create and set the decoder module.
// createDecoderModule({}).then(function (module: any) {
//   // This is reached when everything is ready, and you can call methods on
//   // Module.
//   decoderModule = module;
//   console.log('Decoder Module Initialized!');
//   decoder = new decoderModule.Decoder();
// });

export function activate(extensionContext: ExtensionContext) {
  const zstdDecoder = new ZSTDDecoder();
  let zstdDecoderInitialized = false;
  zstdDecoder.init().then(
    () => {
      console.log("zstd decoder initialized");
      zstdDecoderInitialized = true;
    },
    (error) => {
      console.error(`zstd failed to initialize: ${error}`);
    },
  );
  // Register a new message converter:
  extensionContext.registerMessageConverter({
    fromSchemaName: "point_cloud_interfaces/msg/CompressedPointCloud2",
    toSchemaName: "sensor_msgs/msg/PointCloud2",
    converter: (inputMessage: any): any => {
      const pointcloud2: any = {
        header: inputMessage.header,
        height: inputMessage.height,
        width: inputMessage.width,
        fields: inputMessage.fields,
        is_bigendian: inputMessage.is_bigendian,
        point_step: inputMessage.point_step,
        row_step: inputMessage.row_step,
        is_dense: inputMessage.is_dense,
      };
      if (inputMessage.format === "draco") {
        console.error("Draco format not implemented!");
        // if (decoderModule == null) {
        //   return {}
        // }
        // let dracoPointCloud = new decoderModule.PointCloud();
        // const buffer = new decoderModule.DecoderBuffer();
        // buffer.Init(new Int8Array(inputMessage.compressed_data), inputMessage.compressed_data.length);
        // let status = decoder.DecodeBufferToPointCloud(
        //   buffer,
        //   dracoPointCloud);

        // pointcloud2.data = new Uint8Array()
        // for (let att_id = 0; att_id < dracoPointCloud.num_attributes(); att_id++) {
        //   dracoPointCloud.attribute(att_id);
        // }
        // decoderModule.destroy(buffer);
      } else if (inputMessage.format === "zstd") {
        if (!zstdDecoderInitialized) {
          console.error("zstd decoder not initialized");
          return pointcloud2;
        }
        const uncompressedSize = inputMessage.row_step * inputMessage.height;
        pointcloud2.data = zstdDecoder.decode(inputMessage.compressed_data, uncompressedSize);
      }
      return pointcloud2;
    },
  });
}
