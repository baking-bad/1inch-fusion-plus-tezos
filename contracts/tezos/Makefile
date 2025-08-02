LIGO_VERSION = 1.10.0
LIGO_COMPILER = docker run --rm -v "${PWD}":"${PWD}" -w "${PWD}" ligolang/ligo:${LIGO_VERSION}
OUTPUT_FOLDER = compiled

compile:
	rm -r -f ./${OUTPUT_FOLDER} 
	mkdir ./${OUTPUT_FOLDER}
	${LIGO_COMPILER} compile contract src/escrow_src.mligo -o ${OUTPUT_FOLDER}/escrow_src.tz
	${LIGO_COMPILER} compile contract src/escrow_dst.mligo -o ${OUTPUT_FOLDER}/escrow_dst.tz
	${LIGO_COMPILER} compile contract src/escrow_factory.mligo -o ${OUTPUT_FOLDER}/escrow_factory.tz
	${LIGO_COMPILER} compile contract src/tokens/fa12/fa12.mligo -o ${OUTPUT_FOLDER}/fa12.tz
	${LIGO_COMPILER} compile contract src/tokens/fa2/fa2.jsligo -o ${OUTPUT_FOLDER}/fa2.tz


compile_local:
	rm -r -f ./${OUTPUT_FOLDER} 
	mkdir ./${OUTPUT_FOLDER}
	ligo compile contract src/escrow_src.mligo -o ${OUTPUT_FOLDER}/escrow_src.tz
	ligo compile contract src/escrow_dst.mligo -o ${OUTPUT_FOLDER}/escrow_dst.tz
	ligo compile contract src/escrow_factory.mligo -o ${OUTPUT_FOLDER}/escrow_factory.tz
	ligo compile contract src/tokens/fa12/fa12.mligo -o ${OUTPUT_FOLDER}/fa12.tz
	ligo compile contract src/tokens/fa2/fa2.jsligo -o ${OUTPUT_FOLDER}/fa2.tz
